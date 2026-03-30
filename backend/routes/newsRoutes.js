const express = require('express');
const router = express.Router();
const { createNews, getAllNews, getNewsById, deleteNews } = require('../controllers/newsController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, adminOnly, createNews);  // Admin only
router.get('/', protect, getAllNews);
router.get('/:id', protect, getNewsById);
router.delete('/:id', protect, adminOnly, deleteNews);

module.exports = router;
