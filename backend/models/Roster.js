const mongoose = require("mongoose");

const rosterSchema = new mongoose.Schema(
  {
    nurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    nurseName: {
      type: String,
      default: "",
      trim: true,
    },
    ward: {
      type: String,
      required: true,
    },
    date: {
      type: String, // e.g. "2024-07-15"
      required: true,
    },
    shift: {
      type: String,
      enum: ["7AM-1PM", "1PM-7PM", "7AM-7PM", "7PM-7AM"],
      required: true,
    },
    month: {
      type: String, // e.g. "2024-07"
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Roster", rosterSchema);
