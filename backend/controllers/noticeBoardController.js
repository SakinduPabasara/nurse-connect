const Notice = require('../models/Notice');
const Notification = require('../models/Notification');
const User = require('../models/User');
const mongoose = require('mongoose');


const VALID_CATEGORIES = ['circular', 'training', 'guideline', 'alert'];

// @POST /api/notices
const createNotice = async (req, res) => {
  const { title, content, category } = req.body;

  // --- Validation ---
  if (!title || !content) {
    return res.status(400).json({ message: 'Please provide both title and content' });
  }
  if (title.trim().length < 3) {
    return res.status(400).json({ message: 'Title must be at least 3 characters' });
  }
  if (category && !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }
  // ------------------

  try {
    const notice = await Notice.create({
      title: title.trim(),
      content: content.trim(),
      category: category || 'circular',
      postedBy: req.user._id,
    });

    const populated = await notice.populate('postedBy', 'name');

    // Broadcast notification to all nurses
    const nurses = await User.find({ role: 'nurse' }).select('_id');
    const notifications = nurses.map(nurse => ({
      recipient: nurse._id,
      message: `New notice posted: "${notice.title}"`,
      type: 'announcement',
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/notices
const getNotices = async (req, res) => {
  try {
    const notices = await Notice.find()
      .populate('postedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/notices/:id
const deleteNotice = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid notice ID' });
  }

  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createNotice, getNotices, deleteNotice };