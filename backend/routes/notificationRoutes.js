const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  getUnreadCount,
  markAllRead,
  deleteAllNotifications,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

// NOTE: /unread-count MUST be before /:id/read to avoid Express treating 'unread-count' as an :id
router.get("/unread-count", protect, getUnreadCount);
router.put("/mark-all-read", protect, markAllRead);
router.delete("/", protect, deleteAllNotifications);
router.get("/", protect, getNotifications);
router.put("/:id/read", protect, markAsRead);

module.exports = router;
