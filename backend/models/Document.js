const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    category: {
      type: String,
      enum: ["guideline", "protocol", "training", "reference", "other"],
      default: "reference",
    },
    fileUrl: { type: String, default: "" },
    fileName: { type: String, default: "" },
    fileMimeType: { type: String, default: "" },
    fileSize: { type: Number, default: 0 },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Document", documentSchema);
