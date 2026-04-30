const express = require("express");
const router = express.Router();
const {
  createTransfer,
  getMyTransfers,
  getAllTransfers,
  getMatchingTransfers,
  updateTransferStatus,
  approveTransferPair,
  rejectTransfer,
} = require("../controllers/transferController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/", protect, createTransfer); // Any nurse/admin
router.get("/matches", protect, getMatchingTransfers); // Must be before /:id
router.get("/my", protect, getMyTransfers);
router.get("/", protect, getAllTransfers);
router.post("/approve-pair", protect, adminOnly, approveTransferPair);
router.put("/:id/reject", protect, adminOnly, rejectTransfer);
router.put("/:id", protect, updateTransferStatus);

module.exports = router;
