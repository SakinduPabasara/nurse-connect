const express = require('express');
const router = express.Router();
const { createNotice, getNotices, deleteNotice } = require('../controllers/noticeBoardController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, adminOnly, createNotice);
router.get('/', protect, getNotices);
router.delete('/:id', protect, adminOnly, deleteNotice);

module.exports = router;