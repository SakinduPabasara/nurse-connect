const mongoose = require('mongoose');

const transferRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  currentHospital: { type: String, required: true },
  currentWard: { type: String, required: true },
  desiredHospital: { type: String, required: true },
  desiredWard: { type: String, default: '' },
  transferTimeframe: { type: String, required: true }, // e.g. "2024-09"
  reason: { type: String, default: '' },
  status: {
    type: String,
    enum: ['open', 'matched', 'closed'],
    default: 'open',
  },
  matchedWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('TransferRequest', transferRequestSchema);
