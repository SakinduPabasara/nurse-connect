const express = require("express");
const router = express.Router();
const {
  uploadDocument,
  getAllDocuments,
  getDocumentById,
  downloadDocument,
  deleteDocument,
} = require("../controllers/documentController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { documentUpload } = require("../middleware/uploadMiddleware");

router.post(
  "/",
  protect,
  adminOnly,
  (req, res, next) => {
    documentUpload.single("file")(req, res, (err) => {
      if (err) {
        return res
          .status(400)
          .json({ message: err.message || "File upload failed" });
      }
      next();
    });
  },
  uploadDocument,
); // Admin only
router.get("/", protect, getAllDocuments);
router.get("/download/:id", protect, downloadDocument);
router.get("/:id/download", protect, downloadDocument);
router.get("/:id", protect, getDocumentById);
router.delete("/:id", protect, adminOnly, deleteDocument);

module.exports = router;
