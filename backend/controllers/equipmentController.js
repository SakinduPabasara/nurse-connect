const Equipment = require('../models/Equipment');

const addEquipment = async (req, res) => {
  const { name, ward, status, lastMaintenance } = req.body;
  try {
    const equipment = await Equipment.create({ name, ward, status, lastMaintenance, addedBy: req.user._id });
    res.status(201).json(equipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.find().populate('addedBy', 'name');
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteEquipment = async (req, res) => {
  try {
    await Equipment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Equipment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addEquipment, getEquipment, updateEquipment, deleteEquipment };