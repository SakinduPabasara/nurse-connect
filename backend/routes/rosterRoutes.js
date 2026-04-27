const express = require("express");
const router = express.Router();
const {
  createRoster,
  createRosterBulk,
  getMyRoster,
  getAllRosters,
  getWardRoster,
  getWardNames,
  deleteRoster,
  getDashboardSummary,
  getNurseRoster,
} = require("../controllers/rosterController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/", protect, adminOnly, createRoster);
router.post("/bulk", protect, adminOnly, createRosterBulk);
router.get("/my/summary", protect, getDashboardSummary);
router.get("/my", protect, getMyRoster);
router.get("/all", protect, adminOnly, getAllRosters);
router.get("/wards", protect, getWardNames);
router.get("/nurse/:id", protect, getNurseRoster);
router.get("/ward/:ward", protect, getWardRoster);
router.delete("/:id", protect, adminOnly, deleteRoster);

module.exports = router;
