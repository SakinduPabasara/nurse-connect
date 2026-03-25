const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    enum: ['circular', 'training', 'guideline', 'alert'],
    default: 'circular',
  },
}, { timestamps: true });

module.exports = mongoose.model('Notice', noticeSchema);