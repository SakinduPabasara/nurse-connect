const express = require('express');
const router = express.Router();
const { createRoster, getMyRoster, getWardRoster, deleteRoster, getDashboardSummary } = require('../controllers/rosterController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, adminOnly, createRoster);
router.get('/my/summary', protect, getDashboardSummary);
router.get('/my', protect, getMyRoster);
router.get('/ward/:ward', protect, getWardRoster);
router.delete('/:id', protect, adminOnly, deleteRoster);

module.exports = router;