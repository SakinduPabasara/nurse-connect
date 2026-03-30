const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ['international', 'local', 'training', 'certification'],
    required: true,
  },
  location: { type: String, default: '' },
  deadline: { type: String, default: '' }, // YYYY-MM-DD
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Opportunity', opportunitySchema);
