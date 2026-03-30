const express = require('express');
const router = express.Router();
const { addOvertime, getMyOvertime, getAllOvertime, deleteOvertime } = require('../controllers/overtimeController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, adminOnly, addOvertime);          // Admin records overtime
router.get('/my', protect, getMyOvertime);                  // Nurse views own overtime
router.get('/', protect, adminOnly, getAllOvertime);         // Admin views all overtime
router.delete('/:id', protect, adminOnly, deleteOvertime);  // Admin deletes a record

module.exports = router;
