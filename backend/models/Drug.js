const mongoose = require('mongoose');

const drugSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ward: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'tablets' },
  expiryDate: { type: String, required: true },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

module.exports = mongoose.model('Drug', drugSchema);