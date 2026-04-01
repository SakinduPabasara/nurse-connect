const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  verifyUser,
  getProfile,
  getAllUsers,
  getUserById,
  updateProfile,
} = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/register', registerUser);                          // PUBLIC — nurse self-registers
router.post('/login', loginUser);                                // PUBLIC — NIC + password login
router.get('/profile', protect, getProfile);                     // Any logged-in user
router.put('/profile', protect, updateProfile);                  // Any logged-in user
router.put('/verify/:id', protect, adminOnly, verifyUser);       // Admin only — verify a nurse
router.get('/users', protect, adminOnly, getAllUsers);            // Admin only — list all users
router.get('/users/:id', protect, adminOnly, getUserById);       // Admin only — get one user

module.exports = router;