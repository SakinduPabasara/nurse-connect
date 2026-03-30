const News = require('../models/News');
const Notification = require('../models/Notification');
const User = require('../models/User');
const mongoose = require('mongoose');


const VALID_CATEGORIES = ['healthcare', 'policy', 'professional', 'industry'];

// @POST /api/news  — Admin creates a news article
const createNews = async (req, res) => {
  const { title, content, category, source } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Please provide both title and content' });
  }
  if (title.trim().length < 3) {
    return res.status(400).json({ message: 'Title must be at least 3 characters' });
  }
  if (category && !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }

  try {
    const news = await News.create({
      title: title.trim(),
      content: content.trim(),
      category: category || 'healthcare',
      source: source ? source.trim() : '',
      postedBy: req.user._id,
    });

    const populated = await news.populate('postedBy', 'name');

    // Broadcast notification to all nurses
    const nurses = await User.find({ role: 'nurse' }).select('_id');
    const notifications = nurses.map(nurse => ({
      recipient: nurse._id,
      message: `New healthcare news posted: "${news.title}"`,
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

// @GET /api/news  — All authenticated users view news
const getAllNews = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category && VALID_CATEGORIES.includes(req.query.category)) {
      filter.category = req.query.category;
    }

    const newsList = await News.find(filter)
      .populate('postedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(newsList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/news/:id  — Get a single news article
const getNewsById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid news article ID' });
  }

  try {
    const news = await News.findById(req.params.id).populate('postedBy', 'name');
    if (!news) return res.status(404).json({ message: 'News article not found' });
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/news/:id  — Admin deletes a news article
const deleteNews = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid news article ID' });
  }

  try {
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) return res.status(404).json({ message: 'News article not found' });
    res.json({ message: 'News article deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createNews, getAllNews, getNewsById, deleteNews };
