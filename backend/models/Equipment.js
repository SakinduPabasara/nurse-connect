const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ward: { type: String, required: true },
  status: {
    type: String,
    enum: ['available', 'maintenance', 'unavailable'],
    default: 'available',
  },
  lastMaintenance: { type: String, default: '' },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

module.exports = mongoose.model('Equipment', equipmentSchema);
