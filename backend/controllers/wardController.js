const Ward = require('../models/Ward');
const mongoose = require('mongoose');

// @GET /api/wards  — PUBLIC (used by registration page)
const getWards = async (req, res) => {
  try {
    const wards = await Ward.find().sort({ name: 1 }).select('name description');
    res.json(wards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/wards  — Admin only
const createWard = async (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Ward name is required' });
  }
  try {
    const exists = await Ward.findOne({ name: new RegExp(`^${name.trim()}$`, 'i') });
    if (exists) {
      return res.status(400).json({ message: 'A ward with this name already exists' });
    }
    const ward = await Ward.create({
      name: name.trim(),
      description: (description || '').trim(),
      createdBy: req.user._id,
    });
    res.status(201).json(ward);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PUT /api/wards/:id  — Admin only
const updateWard = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ward ID' });
  }
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Ward name is required' });
  }
  try {
    const ward = await Ward.findById(req.params.id);
    if (!ward) return res.status(404).json({ message: 'Ward not found' });

    // Check duplicate name (excluding self)
    const duplicate = await Ward.findOne({
      name: new RegExp(`^${name.trim()}$`, 'i'),
      _id: { $ne: ward._id },
    });
    if (duplicate) {
      return res.status(400).json({ message: 'A ward with this name already exists' });
    }

    ward.name = name.trim();
    if (description !== undefined) ward.description = description.trim();
    await ward.save();
    res.json(ward);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/wards/:id  — Admin only
const deleteWard = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ward ID' });
  }
  try {
    const ward = await Ward.findByIdAndDelete(req.params.id);
    if (!ward) return res.status(404).json({ message: 'Ward not found' });
    res.json({ message: 'Ward deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getWards, createWard, updateWard, deleteWard };
