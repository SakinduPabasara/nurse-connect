const Drug = require('../models/Drug');

const addDrug = async (req, res) => {
  const { name, ward, quantity, unit, expiryDate } = req.body;
  try {
    const drug = await Drug.create({ name, ward, quantity, unit, expiryDate, addedBy: req.user._id });
    res.status(201).json(drug);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDrugs = async (req, res) => {
  try {
    const drugs = await Drug.find().populate('addedBy', 'name').sort({ createdAt: -1 });
    res.json(drugs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateDrug = async (req, res) => {
  try {
    const drug = await Drug.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(drug);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteDrug = async (req, res) => {
  try {
    await Drug.findByIdAndDelete(req.params.id);
    res.json({ message: 'Drug deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addDrug, getDrugs, updateDrug, deleteDrug };