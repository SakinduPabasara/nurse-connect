const express = require('express');
const router = express.Router();
const { addEquipment, getEquipment, updateEquipment, deleteEquipment } = require('../controllers/equipmentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, adminOnly, addEquipment);
router.get('/', protect, getEquipment);
router.put('/:id', protect, adminOnly, updateEquipment);
router.delete('/:id', protect, adminOnly, deleteEquipment);

module.exports = router;