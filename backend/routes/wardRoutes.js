const express = require('express');
const router = express.Router();
const { getWards, createWard, updateWard, deleteWard } = require('../controllers/wardController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', getWards);                             // PUBLIC — registration page uses this
router.post('/', protect, adminOnly, createWard);
router.put('/:id', protect, adminOnly, updateWard);
router.delete('/:id', protect, adminOnly, deleteWard);

module.exports = router;
