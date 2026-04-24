const express = require("express");
const router = express.Router();
const {
  getHospitals,
  createHospital,
  updateHospital,
  deleteHospital,
} = require("../controllers/hospitalController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Public route for registration
router.get("/", getHospitals);

// Admin-only routes
router.post("/", protect, adminOnly, createHospital);
router.put("/:id", protect, adminOnly, updateHospital);
router.delete("/:id", protect, adminOnly, deleteHospital);

module.exports = router;
