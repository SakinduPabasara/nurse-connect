const express = require('express');
const router = express.Router();

const {
  applyOvertime,
  withdrawOvertime,
  getMyOvertime,
  getAllOvertime,
  reviewOvertime,
  deleteOvertime,
} = require('../controllers/overtimeController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

// NOTE: specific routes (/my, /withdraw/:id) MUST be declared before parameterised /:id
router.post('/', protect, applyOvertime);                          // Nurse — submit OT application
router.get('/my', protect, getMyOvertime);                         // Nurse — view own records
router.delete('/withdraw/:id', protect, withdrawOvertime);         // Nurse — withdraw own pending application

router.get('/', protect, adminOnly, getAllOvertime);                // Admin — all OT records (filter by ?status=)
router.put('/:id', protect, adminOnly, reviewOvertime);            // Admin — approve or reject
router.delete('/:id', protect, adminOnly, deleteOvertime);         // Admin — hard delete

module.exports = router;
