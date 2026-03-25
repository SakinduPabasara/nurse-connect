const mongoose = require('mongoose');

const swapRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetNurse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  requesterShiftDate: { type: String, required: true },
  requesterShift: { type: String, required: true },
  targetShiftDate: { type: String, required: true },
  targetShift: { type: String, required: true },
  reason: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('SwapRequest', swapRequestSchema);