const Drug = require('../models/Drug');
const mongoose = require('mongoose');

// @POST /api/drugs
const addDrug = async (req, res) => {
  const { name, ward, quantity, unit, expiryDate } = req.body;

  // --- Validation ---
  if (!name || !ward || quantity === undefined || !expiryDate) {
    return res.status(400).json({ message: 'Please provide name, ward, quantity, and expiryDate' });
  }
  if (isNaN(quantity) || Number(quantity) < 0) {
    return res.status(400).json({ message: 'Quantity must be a non-negative number' });
  }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(expiryDate)) {
    return res.status(400).json({ message: 'Expiry date must be in YYYY-MM-DD format' });
  }
  // ------------------

  try {
    const drug = await Drug.create({
      name: name.trim(),
      ward: ward.trim(),
      quantity: Number(quantity),
      unit: unit || 'tablets',
      expiryDate,
      addedBy: req.user._id,
    });

    const populated = await drug.populate('addedBy', 'name');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/drugs
const getDrugs = async (req, res) => {
  try {
    const filter = {};
    if (req.query.ward) filter.ward = req.query.ward;

    const drugs = await Drug.find(filter)
      .populate('addedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(drugs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PUT /api/drugs/:id
const updateDrug = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid drug ID' });
  }

  const { quantity, expiryDate } = req.body;

  if (quantity !== undefined && (isNaN(quantity) || Number(quantity) < 0)) {
    return res.status(400).json({ message: 'Quantity must be a non-negative number' });
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (expiryDate && !dateRegex.test(expiryDate)) {
    return res.status(400).json({ message: 'Expiry date must be in YYYY-MM-DD format' });
  }

  try {
    const drug = await Drug.findById(req.params.id);
    if (!drug) {
      return res.status(404).json({ message: 'Drug not found' });
    }

    const updated = await Drug.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('addedBy', 'name');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/drugs/:id
const deleteDrug = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid drug ID' });
  }

  try {
    const drug = await Drug.findByIdAndDelete(req.params.id);
    if (!drug) {
      return res.status(404).json({ message: 'Drug not found' });
    }
    res.json({ message: 'Drug deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addDrug, getDrugs, updateDrug, deleteDrug };