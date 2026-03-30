const express = require('express');
const router = express.Router();
const { uploadDocument, getAllDocuments, getDocumentById, deleteDocument } = require('../controllers/documentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, adminOnly, uploadDocument);  // Admin only
router.get('/', protect, getAllDocuments);
router.get('/:id', protect, getDocumentById);
router.delete('/:id', protect, adminOnly, deleteDocument);

module.exports = router;
