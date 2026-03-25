const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getProfile } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/register', protect, adminOnly, registerUser); // Only admin can register
router.post('/login', loginUser);                            // Public
router.get('/profile', protect, getProfile);                 // Any logged in user

module.exports = router;