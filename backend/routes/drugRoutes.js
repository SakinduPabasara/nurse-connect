const express = require('express');
const router = express.Router();
const { addDrug, getDrugs, updateDrug, deleteDrug } = require('../controllers/drugController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, adminOnly, addDrug);
router.get('/', protect, getDrugs);
router.put('/:id', protect, adminOnly, updateDrug);
router.delete('/:id', protect, adminOnly, deleteDrug);

module.exports = router;