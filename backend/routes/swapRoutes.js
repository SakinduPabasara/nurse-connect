const express = require('express');
const router = express.Router();
const { createSwap, getMySwaps, respondToSwap, getAllSwaps, deleteSwap } = require('../controllers/swapController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, createSwap);
router.get('/my', protect, getMySwaps);
router.get('/', protect, adminOnly, getAllSwaps);
router.put('/:id', protect, respondToSwap);
router.delete('/:id', protect, adminOnly, deleteSwap);

module.exports = router;