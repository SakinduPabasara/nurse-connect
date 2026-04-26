const express = require('express');
const router = express.Router();
const { createSwap, getMySwaps, respondToSwap, getAllSwaps } = require('../controllers/swapController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, createSwap);
router.get('/my', protect, getMySwaps);
router.get('/', protect, adminOnly, getAllSwaps);
router.put('/:id', protect, respondToSwap);

module.exports = router;