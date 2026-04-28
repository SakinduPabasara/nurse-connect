const Ward = require('../models/Ward');
const User = require('../models/User');
const mongoose = require('mongoose');

// @GET /api/wards  — PUBLIC/ADMIN (includes user counts)
const getWards = async (req, res) => {
  try {
    const filter = {};
    if (req.query.hospital) filter.hospital = req.query.hospital;
    
    const wards = await Ward.find(filter).sort({ name: 1 });
    
    // Get user counts for each ward
    const wardWithCounts = await Promise.all(
      wards.map(async (w) => {
        const count = await User.countDocuments({ hospital: w.hospital, ward: w.name });
        return {
          ...w.toObject(),
          userCount: count,
        };
      })
    );

    res.json(wardWithCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/wards  — Admin only
const createWard = async (req, res) => {
  const { hospital, name, description } = req.body;
  if (!hospital) {
    return res.status(400).json({ message: 'Hospital name is required' });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Ward name is required' });
  }
  try {
    const exists = await Ward.findOne({ 
      hospital: hospital.trim(),
      name: new RegExp(`^${name.trim()}$`, 'i') 
    });
    if (exists) {
      return res.status(400).json({ message: 'A ward with this name already exists in this hospital' });
    }
    const ward = await Ward.create({
      hospital: hospital.trim(),
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

    // Check duplicate name (excluding self) within the same hospital
    const duplicate = await Ward.findOne({
      hospital: ward.hospital,
      name: new RegExp(`^${name.trim()}$`, 'i'),
      _id: { $ne: ward._id },
    });
    if (duplicate) {
      return res.status(400).json({ message: 'A ward with this name already exists in this hospital' });
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
