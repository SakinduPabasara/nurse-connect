const mongoose = require('mongoose');

const overtimeSchema = new mongoose.Schema(
  {
    nurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    shift: {
      type: String,
      enum: ['morning', 'evening', 'night', 'custom'],
      default: 'custom',
    },
    extraHours: {
      type: Number,
      required: true,
      min: 0.5,
    },
    reason: {
      type: String,
      default: '',
      trim: true,
    },
    // Approval workflow
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNote: {
      type: String,
      default: '',
      trim: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    // Admin sets the exact LKR payout when approving (can differ from hours × default rate)
    approvedAmount: {
      type: Number,
      min: 0,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Overtime', overtimeSchema);
