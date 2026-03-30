const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: {
    type: String,
    enum: ['guideline', 'protocol', 'training', 'reference'],
    default: 'reference',
  },
  fileUrl: { type: String, required: true }, // External URL or base64 data URI
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
