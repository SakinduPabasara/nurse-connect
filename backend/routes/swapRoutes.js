const express = require('express');
const router = express.Router();
const { createSwap, getMySwaps, respondToSwap } = require('../controllers/swapController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createSwap);
router.get('/my', protect, getMySwaps);
router.put('/:id', protect, respondToSwap);

module.exports = router;