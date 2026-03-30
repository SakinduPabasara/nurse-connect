const Equipment = require('../models/Equipment');
const mongoose = require('mongoose');

const VALID_STATUSES = ['available', 'maintenance', 'unavailable'];

// @POST /api/equipment
const addEquipment = async (req, res) => {
  const { name, ward, status, lastMaintenance } = req.body;

  // --- Validation ---
  if (!name || !ward) {
    return res.status(400).json({ message: 'Please provide both name and ward' });
  }
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
  }
  if (lastMaintenance) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(lastMaintenance)) {
      return res.status(400).json({ message: 'lastMaintenance must be in YYYY-MM-DD format' });
    }
  }
  // ------------------

  try {
    const equipment = await Equipment.create({
      name: name.trim(),
      ward: ward.trim(),
      status: status || 'available',
      lastMaintenance: lastMaintenance || '',
      addedBy: req.user._id,
    });

    const populated = await equipment.populate('addedBy', 'name');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/equipment
const getEquipment = async (req, res) => {
  try {
    const filter = {};
    if (req.query.ward) filter.ward = req.query.ward;

    const equipment = await Equipment.find(filter)
      .populate('addedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PUT /api/equipment/:id
const updateEquipment = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid equipment ID' });
  }

  const { status } = req.body;
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    const updated = await Equipment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('addedBy', 'name');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/equipment/:id
const deleteEquipment = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid equipment ID' });
  }

  try {
    const equipment = await Equipment.findByIdAndDelete(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addEquipment, getEquipment, updateEquipment, deleteEquipment };