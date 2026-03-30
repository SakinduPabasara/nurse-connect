const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getProfile, getAllUsers, getUserById, updateProfile } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/register', protect, adminOnly, registerUser); // Only admin can register
router.post('/login', loginUser);                            // Public
router.get('/profile', protect, getProfile);                 // Any logged in user
router.put('/profile', protect, updateProfile);              // Any logged in user update own profile
router.get('/users', protect, adminOnly, getAllUsers);        // Admin only
router.get('/users/:id', protect, adminOnly, getUserById);   // Admin only

module.exports = router;