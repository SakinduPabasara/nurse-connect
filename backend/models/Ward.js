const mongoose = require("mongoose");

const wardSchema = new mongoose.Schema(
  {
    hospital: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

// Enforce uniqueness per hospital (same ward name can exist in different hospitals).
wardSchema.index({ hospital: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Ward", wardSchema);
