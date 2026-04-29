const User = require("../models/User");
const Notification = require("../models/Notification");
const Roster = require("../models/Roster");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { getIO } = require("../utils/socketManager");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// NIC validation: Sri Lanka NIC — old format 9 digits + V/X, or new format 12 digits
const NIC_REGEX = /^(\d{9}[VvXx]|\d{12})$/;
const PHONE_REGEX = /^\d{10}$/;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// ─────────────────────────────────────────────
// @POST /api/auth/register  (PUBLIC — nurse self-registers)
// ─────────────────────────────────────────────
const registerUser = async (req, res) => {
  const { name, nic, address, telephone, hospital, ward, password, confirmPassword } =
    req.body;

  // --- Field presence ---
  if (
    !name ||
    !nic ||
    !address ||
    !telephone ||
    !hospital ||
    !ward ||
    !password ||
    !confirmPassword
  ) {
    return res.status(400).json({
      message:
        "All fields are required: name, nic, address, telephone, hospital, ward, password, confirmPassword",
    });
  }

  // --- Name ---
  if (name.trim().length < 2) {
    return res
      .status(400)
      .json({ message: "Name must be at least 2 characters" });
  }

  // --- NIC format ---
  if (!NIC_REGEX.test(nic.trim())) {
    return res.status(400).json({
      message:
        "NIC must be either the old format (9 digits + V/X) or new format (12 digits)",
    });
  }

  // --- Telephone ---
  if (!PHONE_REGEX.test(telephone.trim())) {
    return res
      .status(400)
      .json({ message: "Telephone number must be exactly 10 digits" });
  }

  // --- Password strength ---
  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
    });
  }

  // --- Confirm password ---
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    // --- Duplicate NIC check ---
    const nicExists = await User.findOne({ nic: nic.trim() });
    if (nicExists) {
      return res
        .status(400)
        .json({ message: "A user with this NIC already exists" });
    }

    const user = await User.create({
      name: name.trim(),
      nic: nic.trim().toUpperCase(),
      address: address.trim(),
      telephone: telephone.trim(),
      hospital: hospital.trim(),
      ward: ward.trim(),
      password,
      role: "nurse",
      isVerified: false,
    });

    // Notify all admins that a new nurse has registered and is awaiting verification
    const admins = await User.find({ role: "admin" }).select("_id");
    const adminNotifications = admins.map((admin) => ({
      recipient: admin._id,
      message: `New nurse registration pending verification: ${user.name} (NIC: ${user.nic}) from ${user.hospital}.`,
      type: "announcement",
    }));
    if (adminNotifications.length > 0) {
      await Notification.insertMany(adminNotifications);
    }

    res.status(201).json({
      message:
        "Registration successful. Your account is pending admin verification. You will be notified via SMS once your account is approved.",
      user: {
        _id: user._id,
        name: user.name,
        nic: user.nic,
        hospital: user.hospital,
        isVerified: false,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// @POST /api/auth/login  (NIC + Password)
// ─────────────────────────────────────────────
const loginUser = async (req, res) => {
  const { nic, password } = req.body;

  if (!nic || !password) {
    return res
      .status(400)
      .json({ message: "Please provide both NIC and password" });
  }

  try {
    const user = await User.findOne({ nic: nic.trim().toUpperCase() });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid NIC or password" });
    }

    // Block login if not verified (only for nurses — admins are always verified)
    if (user.role === "nurse" && !user.isVerified) {
      return res.status(403).json({
        message:
          "Your account is not yet verified. Please wait for admin approval. You will receive an SMS once your account is activated.",
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      nic: user.nic,
      role: user.role,
      ward: user.ward,
      hospital: user.hospital,
      isVerified: user.isVerified,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// @PUT /api/auth/verify/:id  (Admin only — verify a nurse account)
// ─────────────────────────────────────────────
const verifyUser = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "nurse") {
      return res
        .status(400)
        .json({ message: "Only nurse accounts can be verified" });
    }
    if (user.isVerified) {
      return res
        .status(400)
        .json({ message: "This account is already verified" });
    }

    user.isVerified = true;
    await user.save();

    // ── SMS Notification (placeholder — replace with Twilio when ready) ──
    sendSMSVerification(user.telephone, user.name);
    // ────────────────────────────────────────────────────────────────────

    res.json({
      message: `Account for ${user.name} has been verified successfully. SMS sent to ${user.telephone}.`,
      user: {
        _id: user._id,
        name: user.name,
        nic: user.nic,
        hospital: user.hospital,
        telephone: user.telephone,
        isVerified: true,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// SMS Utility (plug in Twilio here later)
// ─────────────────────────────────────────────
const sendSMSVerification = (telephone, name) => {
  // TODO: Replace this with Twilio integration:
  // const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  // twilio.messages.create({
  //   body: `Hello ${name}, your Nurse Connect account has been verified. You can now log in with your NIC.`,
  //   from: process.env.TWILIO_PHONE,
  //   to: `+94${telephone.slice(1)}`, // Convert 07x to +947x (Sri Lanka)
  // });
  console.log(
    `[SMS] Verification SMS sent to ${telephone}: Hello ${name}, your Nurse Connect account has been verified. You can now log in with your NIC.`,
  );
};

// ─────────────────────────────────────────────
// @DELETE /api/auth/reject/:id  (Admin only — reject a pending nurse registration)
// ─────────────────────────────────────────────
const rejectUser = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid user ID.' });
  }

  const { reason } = req.body; // optional rejection reason

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (user.role !== 'nurse') {
      return res.status(400).json({ message: 'Only nurse accounts can be rejected.' });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: 'Cannot reject an already-verified nurse account.' });
    }

    const nurseInfo = { name: user.name, nic: user.nic, hospital: user.hospital, telephone: user.telephone };

    // Log rejection for audit trail
    console.log(
      `[REJECT] Admin ${req.user.name} (${req.user._id}) rejected nurse registration: ${user.name} (NIC: ${user.nic}).` +
      (reason ? ` Reason: ${reason}` : ' No reason provided.'),
    );

    await user.deleteOne();

    res.json({
      message: `Registration for ${nurseInfo.name} (NIC: ${nurseInfo.nic}) has been rejected and removed.`,
      rejectedNurse: nurseInfo,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// @GET /api/auth/profile
// ─────────────────────────────────────────────
const getProfile = async (req, res) => {
  const user = req.user;
  res.json({
    _id: user._id,
    name: user.name,
    nic: user.nic,
    address: user.address,
    telephone: user.telephone,
    hospital: user.hospital,
    ward: user.ward,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  });
};

// ─────────────────────────────────────────────
// @GET /api/auth/users  (Admin only — includes unverified nurses)
// ─────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.isVerified !== undefined) {
      filter.isVerified = req.query.isVerified === "true";
    }
    if (req.query.role && ["nurse", "admin"].includes(req.query.role)) {
      filter.role = req.query.role;
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// @GET /api/auth/users/:id  (Admin only)
// ─────────────────────────────────────────────
const getUserById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// @DELETE /api/auth/users/:id  (Admin only)
// ─────────────────────────────────────────────
const deleteUser = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (String(targetUser._id) === String(req.user._id)) {
      return res.status(400).json({
        message: "You cannot delete your own account while logged in",
      });
    }

    if (targetUser.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res
          .status(400)
          .json({ message: "Cannot delete the last admin account" });
      }
    }

    // Preserve nurse names in historical roster rows after account deletion.
    await Roster.updateMany(
      {
        nurse: targetUser._id,
        $or: [{ nurseName: { $exists: false } }, { nurseName: "" }],
      },
      { $set: { nurseName: targetUser.name || "Deleted user" } },
    );

    await targetUser.deleteOne();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// @PUT /api/auth/profile  (Logged-in user updates own info)
// ─────────────────────────────────────────────
const updateProfile = async (req, res) => {
  const { name, address, telephone, ward, email, hospital, currentPassword, newPassword } = req.body;

  if (!name && !address && !telephone && !ward && !email && !hospital && !newPassword) {
    return res.status(400).json({ message: "Please provide at least one field to update" });
  }

  if (telephone && !PHONE_REGEX.test(telephone.trim())) {
    return res.status(400).json({ message: "Telephone number must be exactly 10 digits" });
  }

  if (newPassword && !PASSWORD_REGEX.test(newPassword)) {
    return res.status(400).json({
      message: "Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
    });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "You must provide your current password to set a new password." });
      }
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: "Current password is incorrect." });
      }
      user.password = newPassword;
    }

    if (req.user.role !== 'admin') {
      // Prevent changing ward/hospital if you're a nurse
      if (ward !== undefined && ward.trim() !== user.ward) {
        return res.status(403).json({ message: "Clinical ward assignment is locked for your account level. Contact an administrator for re-assignment." });
      }
      if (hospital !== undefined && hospital.trim() !== user.hospital) {
        return res.status(403).json({ message: "Medical center assignment is locked. Contact an administrator for institutional transfer." });
      }
    }

    if (name) user.name = name.trim();
    if (address) user.address = address.trim();
    if (telephone) user.telephone = telephone.trim();
    if (ward !== undefined) user.ward = ward.trim();
    if (hospital !== undefined) user.hospital = hospital.trim();
    if (email !== undefined) user.email = email.trim();

    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;

    try {
      getIO().to("user:" + user._id.toString()).emit("user:updated", safeUser);
      getIO().to("admin").emit("user:updated", safeUser);
    } catch (err) {
      // Socket not ready or not configured; ignore to avoid breaking the request.
    }

    res.json({
      _id: user._id,
      name: user.name,
      nic: user.nic,
      address: user.address,
      telephone: user.telephone,
      hospital: user.hospital,
      ward: user.ward,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      token: generateToken(user._id), // re-issue token just in case
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// @GET /api/auth/stats  (PUBLIC — login page stats)
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// @POST /api/auth/avatar (Upload and update profile picture)
// ─────────────────────────────────────────────
const uploadAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Please upload an image file" });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete old avatar if it exists
    if (user.profilePic) {
      const fs = require("fs");
      const path = require("path");
      const oldPath = path.join(__dirname, "..", user.profilePic);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Store relative path
    const filePath = `/uploads/avatars/${req.file.filename}`;
    user.profilePic = filePath;
    await user.save();

    res.json({
      message: "Profile picture updated successfully",
      profilePic: filePath,
      user: {
        _id: user._id,
        name: user.name,
        nic: user.nic,
        profilePic: user.profilePic,
        role: user.role,
        hospital: user.hospital,
        isVerified: user.isVerified,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// @DELETE /api/auth/avatar (Delete profile picture)
// ─────────────────────────────────────────────
const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.profilePic) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '..', user.profilePic);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    user.profilePic = '';
    await user.save();

    res.json({
      message: 'Profile picture deleted successfully',
      user: {
        _id: user._id,
        name: user.name,
        nic: user.nic,
        profilePic: '',
        role: user.role,
        hospital: user.hospital,
        isVerified: user.isVerified,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPublicStats = async (req, res) => {
  try {
    const [totalNurses, hospitals] = await Promise.all([
      User.countDocuments({ role: 'nurse', isVerified: true }),
      User.distinct('hospital', { role: 'nurse', isVerified: true }),
    ]);
    
    // Safely filter and count unique hospitals
    const validHospitals = Array.isArray(hospitals) 
      ? hospitals.filter(h => typeof h === 'string' && h.trim().length > 0)
      : [];

    res.json({
      nurses: totalNurses || 0,
      hospitals: validHospitals.length,
    });
  } catch (error) {
    console.error('[AUTH_STATS_ERROR]', error);
    res.status(500).json({ message: "Failed to load platform statistics" });
  }
};

// ─────────────────────────────────────────────
// @PUT /api/auth/users/:id  (Admin only — edit any user's info)
// ─────────────────────────────────────────────
const updateUser = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  const { hospital, ward, role, isVerified, name, telephone, nic } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Protect against self-demotion or self-unverification if needed, 
    // but usually admins can manage themselves except for deletion.
    
    if (hospital !== undefined) user.hospital = hospital.trim();
    if (ward !== undefined) user.ward = ward.trim();
    if (role !== undefined) user.role = role;
    if (isVerified !== undefined) user.isVerified = isVerified;
    if (name !== undefined) user.name = name.trim();
    if (telephone !== undefined) user.telephone = telephone.trim();
    if (nic !== undefined) user.nic = nic.trim().toUpperCase();

    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;

    try {
      getIO().to("user:" + user._id.toString()).emit("user:updated", safeUser);
      getIO().to("admin").emit("user:updated", safeUser);
    } catch (err) {
      // Socket not ready or not configured; ignore to avoid breaking the request.
    }

    res.json({ message: "User updated successfully", user: safeUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVerifiedNurses = async (req, res) => {
  try {
    const nurses = await User.find({ role: "nurse", isVerified: true })
      .select("_id name ward hospital")
      .sort({ name: 1 });
    res.json(nurses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyUser,
  rejectUser,
  getProfile,
  getAllUsers,
  getUserById,
  deleteUser,
  updateUser,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  getPublicStats,
  getVerifiedNurses,
};
