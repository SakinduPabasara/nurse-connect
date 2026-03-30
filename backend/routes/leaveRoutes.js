const express = require('express');
const router = express.Router();
const { applyLeave, getMyLeave, getAllLeave, updateLeaveStatus } = require('../controllers/leaveController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, applyLeave);                    // Any nurse
router.get('/my', protect, getMyLeave);                   // Nurse views own leave
router.get('/', protect, adminOnly, getAllLeave);          // Admin views all
router.put('/:id', protect, adminOnly, updateLeaveStatus);// Admin approves/rejects

module.exports = router;
