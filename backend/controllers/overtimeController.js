const Overtime = require('../models/Overtime');
const mongoose = require('mongoose');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// @POST /api/overtime  — Admin records overtime for a nurse
const addOvertime = async (req, res) => {
  const { nurse, date, extraHours, reason } = req.body;

  if (!nurse || !date || extraHours === undefined) {
    return res.status(400).json({ message: 'Please provide nurse, date, and extraHours' });
  }
  if (!mongoose.Types.ObjectId.isValid(nurse)) {
    return res.status(400).json({ message: 'Invalid nurse ID' });
  }
  if (!DATE_REGEX.test(date)) {
    return res.status(400).json({ message: 'date must be in YYYY-MM-DD format' });
  }
  if (isNaN(extraHours) || Number(extraHours) <= 0) {
    return res.status(400).json({ message: 'extraHours must be a positive number' });
  }

  try {
    const record = await Overtime.create({
      nurse,
      date,
      extraHours: Number(extraHours),
      reason: reason || '',
      recordedBy: req.user._id,
    });

    const populated = await record.populate([
      { path: 'nurse', select: 'name email ward' },
      { path: 'recordedBy', select: 'name' },
    ]);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/overtime/my  — Nurse views own overtime records
const getMyOvertime = async (req, res) => {
  try {
    const records = await Overtime.find({ nurse: req.user._id })
      .populate('recordedBy', 'name')
      .sort({ date: -1 });

    const totalHours = records.reduce((sum, r) => sum + r.extraHours, 0);

    res.json({ totalOvertimeHours: totalHours, records });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/overtime  — Admin views all overtime records
const getAllOvertime = async (req, res) => {
  try {
    const filter = {};
    if (req.query.nurse && mongoose.Types.ObjectId.isValid(req.query.nurse)) {
      filter.nurse = req.query.nurse;
    }

    const records = await Overtime.find(filter)
      .populate('nurse', 'name email ward hospital')
      .populate('recordedBy', 'name')
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/overtime/:id  — Admin deletes an overtime record
const deleteOvertime = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid overtime record ID' });
  }

  try {
    const record = await Overtime.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: 'Overtime record not found' });
    res.json({ message: 'Overtime record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addOvertime, getMyOvertime, getAllOvertime, deleteOvertime };
