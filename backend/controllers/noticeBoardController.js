const Notice = require('../models/Notice');

// @POST /api/notices  — Create notice (Admin)
const createNotice = async (req, res) => {
  const { title, content, category } = req.body;
  try {
    const notice = await Notice.create({ title, content, category, postedBy: req.user._id });
    res.status(201).json(notice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/notices  — Get all notices
const getNotices = async (req, res) => {
  try {
    const notices = await Notice.find().populate('postedBy', 'name').sort({ createdAt: -1 });
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/notices/:id  — Delete notice (Admin)
const deleteNotice = async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notice deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createNotice, getNotices, deleteNotice };