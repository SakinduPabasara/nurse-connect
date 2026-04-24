const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['swap', 'roster', 'announcement', 'alert', 'training', 'overtime', 'leave', 'transfer'],
    default: 'announcement',
  },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);