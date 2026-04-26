const Document = require("../models/Document");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const VALID_CATEGORIES = [
  "guideline",
  "protocol",
  "training",
  "reference",
  "other",
];

const buildPublicFileUrl = (req, fileName) => {
  return `${req.protocol}://${req.get("host")}/uploads/documents/${fileName}`;
};

// @POST /api/documents  — Admin uploads/links a document
const uploadDocument = async (req, res) => {
  const body = req.body || {};
  const { title, description, category, fileUrl } = body;

  if (!title) {
    return res.status(400).json({ message: "Please provide title" });
  }
  if (title.trim().length < 3) {
    return res
      .status(400)
      .json({ message: "Title must be at least 3 characters" });
  }
  if (category && !VALID_CATEGORIES.includes(category)) {
    return res
      .status(400)
      .json({
        message: `Category must be one of: ${VALID_CATEGORIES.join(", ")}`,
      });
  }

  if (!req.file && (!fileUrl || !fileUrl.trim())) {
    return res
      .status(400)
      .json({ message: "Please upload a file or provide a URL" });
  }

  try {
    const normalizedUrl = fileUrl ? fileUrl.trim() : "";
    const documentUrl = req.file
      ? buildPublicFileUrl(req, req.file.filename)
      : normalizedUrl;

    const doc = await Document.create({
      title: title.trim(),
      description: description ? description.trim() : "",
      category: category || "reference",
      fileUrl: documentUrl,
      fileName: req.file ? req.file.originalname : "",
      fileMimeType: req.file ? req.file.mimetype : "",
      fileSize: req.file ? req.file.size : 0,
      uploadedBy: req.user._id,
    });

    const populated = await doc.populate("uploadedBy", "name");

    // Broadcast notification to all nurses
    const User = require("../models/User");
    const Notification = require("../models/Notification");
    const { getIO } = require("../utils/socketManager");
    
    const nurses = await User.find({ role: "nurse" }).select("_id");
    const notifications = nurses.map(nurse => ({
      recipient: nurse._id,
      message: `New hospital document uploaded: "${doc.title}" (${doc.category})`,
      type: 'announcement',
    }));
    
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      try {
        notifications.forEach(n => {
          getIO().to('user:' + n.recipient.toString()).emit('notification:new', { ...n, isRead: false, createdAt: new Date() });
        });
      } catch (err) {
        console.error('Socket emit error:', err.message);
      }
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/documents  — All authenticated users view documents
const getAllDocuments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category && VALID_CATEGORIES.includes(req.query.category)) {
      filter.category = req.query.category;
    }
    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: "i" };
    }

    const documents = await Document.find(filter)
      .populate("uploadedBy", "name")
      .sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/documents/:id  — Get a single document
const getDocumentById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid document ID" });
  }

  try {
    const doc = await Document.findById(req.params.id).populate(
      "uploadedBy",
      "name",
    );
    if (!doc) return res.status(404).json({ message: "Document not found" });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/documents/:id/download  — Authenticated download for nurses/admins
const downloadDocument = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid document ID" });
  }

  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const safeTitle = (doc.title || "document")
      .replace(/[^a-zA-Z0-9-_]+/g, "_")
      .slice(0, 80);
    const preferredName = doc.fileName?.trim() || safeTitle;
    const localPrefix = "/uploads/documents/";

    if (doc.fileUrl && doc.fileUrl.includes(localPrefix)) {
      const fileName = doc.fileUrl.split(localPrefix)[1];
      const filePath = path.join(
        __dirname,
        "..",
        "uploads",
        "documents",
        fileName || "",
      );
      if (!fileName || !fs.existsSync(filePath)) {
        return res
          .status(404)
          .json({ message: "Uploaded file not found on server" });
      }
      return res.download(filePath, preferredName);
    }

    if (doc.fileUrl && /^https?:\/\//i.test(doc.fileUrl)) {
      const remote = await fetch(doc.fileUrl);
      if (!remote.ok) {
        return res
          .status(502)
          .json({ message: "Could not fetch remote document" });
      }

      const contentType =
        remote.headers.get("content-type") || "application/octet-stream";
      const fileBuffer = Buffer.from(await remote.arrayBuffer());

      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${preferredName}"`,
      );
      return res.send(fileBuffer);
    }

    return res
      .status(400)
      .json({ message: "No downloadable source found for this document" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/documents/:id  — Admin deletes a document
const deleteDocument = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid document ID" });
  }

  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const localPrefix = "/uploads/documents/";
    if (doc.fileUrl && doc.fileUrl.includes(localPrefix)) {
      const fileName = doc.fileUrl.split(localPrefix)[1];
      if (fileName) {
        const filePath = path.join(
          __dirname,
          "..",
          "uploads",
          "documents",
          fileName,
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    await doc.deleteOne();

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadDocument,
  getAllDocuments,
  getDocumentById,
  downloadDocument,
  deleteDocument,
};
