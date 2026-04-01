const User = require('../models/User');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// NIC validation: Sri Lanka NIC — old format 9 digits + V/X, or new format 12 digits
const NIC_REGEX = /^(\d{9}[VvXx]|\d{12})$/;
const PHONE_REGEX = /^\d{10}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// ─────────────────────────────────────────────
// @POST /api/auth/register  (PUBLIC — nurse self-registers)
// ─────────────────────────────────────────────
const registerUser = async (req, res) => {
  const { name, nic, address, telephone, hospital, password, confirmPassword } = req.body;

  // --- Field presence ---
  if (!name || !nic || !address || !telephone || !hospital || !password || !confirmPassword) {
    return res.status(400).json({
      message: 'All fields are required: name, nic, address, telephone, hospital, password, confirmPassword',
    });
  }

  // --- Name ---
  if (name.trim().length < 2) {
    return res.status(400).json({ message: 'Name must be at least 2 characters' });
  }

  // --- NIC format ---
  if (!NIC_REGEX.test(nic.trim())) {
    return res.status(400).json({
      message: 'NIC must be either the old format (9 digits + V/X) or new format (12 digits)',
    });
  }

  // --- Telephone ---
  if (!PHONE_REGEX.test(telephone.trim())) {
    return res.status(400).json({ message: 'Telephone number must be exactly 10 digits' });
  }

  // --- Password strength ---
  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({
      message:
        'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
    });
  }

  // --- Confirm password ---
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    // --- Duplicate NIC check ---
    const nicExists = await User.findOne({ nic: nic.trim() });
    if (nicExists) {
      return res.status(400).json({ message: 'A user with this NIC already exists' });
    }

    const user = await User.create({
      name: name.trim(),
      nic: nic.trim().toUpperCase(),
      address: address.trim(),
      telephone: telephone.trim(),
      hospital: hospital.trim(),
      password,
      role: 'nurse',
      isVerified: false,
    });

    // Notify all admins that a new nurse has registered and is awaiting verification
    const admins = await User.find({ role: 'admin' }).select('_id');
    const adminNotifications = admins.map((admin) => ({
      recipient: admin._id,
      message: `New nurse registration pending verification: ${user.name} (NIC: ${user.nic}) from ${user.hospital}.`,
      type: 'announcement',
    }));
    if (adminNotifications.length > 0) {
      await Notification.insertMany(adminNotifications);
    }

    res.status(201).json({
      message:
        'Registration successful. Your account is pending admin verification. You will be notified via SMS once your account is approved.',
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
    return res.status(400).json({ message: 'Please provide both NIC and password' });
  }

  try {
    const user = await User.findOne({ nic: nic.trim().toUpperCase() });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid NIC or password' });
    }

    // Block login if not verified (only for nurses — admins are always verified)
    if (user.role === 'nurse' && !user.isVerified) {
      return res.status(403).json({
        message:
          'Your account is not yet verified. Please wait for admin approval. You will receive an SMS once your account is activated.',
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
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'nurse') {
      return res.status(400).json({ message: 'Only nurse accounts can be verified' });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: 'This account is already verified' });
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
  console.log(`[SMS] Verification SMS sent to ${telephone}: Hello ${name}, your Nurse Connect account has been verified. You can now log in with your NIC.`);
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
      filter.isVerified = req.query.isVerified === 'true';
    }
    if (req.query.role && ['nurse', 'admin'].includes(req.query.role)) {
      filter.role = req.query.role;
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
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
    return res.status(400).json({ message: 'Invalid user ID' });
  }
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// @PUT /api/auth/profile  (Logged-in user updates own info)
// ─────────────────────────────────────────────
const updateProfile = async (req, res) => {
  const { name, address, telephone, ward, email } = req.body;

  if (!name && !address && !telephone && !ward && !email) {
    return res.status(400).json({ message: 'Please provide at least one field to update' });
  }

  if (telephone && !PHONE_REGEX.test(telephone.trim())) {
    return res.status(400).json({ message: 'Telephone number must be exactly 10 digits' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name.trim();
    if (address) user.address = address.trim();
    if (telephone) user.telephone = telephone.trim();
    if (ward !== undefined) user.ward = ward.trim();
    if (email !== undefined) user.email = email.trim();

    await user.save();

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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, verifyUser, getProfile, getAllUsers, getUserById, updateProfile };