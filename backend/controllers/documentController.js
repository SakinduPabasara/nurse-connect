const Document = require('../models/Document');
const mongoose = require('mongoose');

const VALID_CATEGORIES = ['guideline', 'protocol', 'training', 'reference'];

// @POST /api/documents  — Admin uploads/links a document
const uploadDocument = async (req, res) => {
  const { title, description, category, fileUrl } = req.body;

  if (!title || !fileUrl) {
    return res.status(400).json({ message: 'Please provide both title and fileUrl' });
  }
  if (title.trim().length < 3) {
    return res.status(400).json({ message: 'Title must be at least 3 characters' });
  }
  if (category && !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }

  try {
    const doc = await Document.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category || 'reference',
      fileUrl: fileUrl.trim(),
      uploadedBy: req.user._id,
    });

    const populated = await doc.populate('uploadedBy', 'name');
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
      filter.title = { $regex: req.query.search, $options: 'i' };
    }

    const documents = await Document.find(filter)
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/documents/:id  — Get a single document
const getDocumentById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid document ID' });
  }

  try {
    const doc = await Document.findById(req.params.id).populate('uploadedBy', 'name');
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/documents/:id  — Admin deletes a document
const deleteDocument = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid document ID' });
  }

  try {
    const doc = await Document.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadDocument, getAllDocuments, getDocumentById, deleteDocument };
