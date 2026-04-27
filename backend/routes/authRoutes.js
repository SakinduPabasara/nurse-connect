const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
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
} = require("../controllers/authController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/avatars/");
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) return cb(null, true);
  cb(new Error("Only images (jpeg, jpg, png, webp) are allowed"));
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.get("/stats", getPublicStats);          // PUBLIC — login page live stats
router.post("/register", registerUser);         // PUBLIC — nurse self-registers
router.post("/login", loginUser);               // PUBLIC — NIC + password login
router.get("/profile", protect, getProfile); // Any logged-in user
router.put("/profile", protect, updateProfile); // Any logged-in user
router.post("/avatar", protect, upload.single("avatar"), uploadAvatar); // Any logged-in user
router.delete("/avatar", protect, deleteAvatar); // Any logged-in user
router.put("/verify/:id", protect, adminOnly, verifyUser);   // Admin only — verify a nurse
router.delete("/reject/:id", protect, adminOnly, rejectUser); // Admin only — reject a pending nurse
router.get("/users", protect, adminOnly, getAllUsers); // Admin only — list all users
router.get("/nurses", protect, getVerifiedNurses);   // Any logged-in user — list verified nurses for swaps
router.get("/users/:id", protect, adminOnly, getUserById); // Admin only — get one user
router.delete("/users/:id", protect, adminOnly, deleteUser); // Admin only — delete a user
router.put("/users/:id", protect, adminOnly, updateUser);    // Admin only — edit a user

module.exports = router;
