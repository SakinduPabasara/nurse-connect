const Post = require('../models/Post');
const mongoose = require('mongoose');

const VALID_CATEGORIES = ['discussion', 'advice', 'experience', 'support'];

// @POST /api/community  — Any authenticated user creates a post
const createPost = async (req, res) => {
  const { title, content, category } = req.body;

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
    const post = await Post.create({
      author: req.user._id,
      title: title.trim(),
      content: content.trim(),
      category: category || 'discussion',
    });

    const populated = await Post.findById(post._id)
      .populate('author', 'name role ward');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/community  — All authenticated users view posts
const getAllPosts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category && VALID_CATEGORIES.includes(req.query.category)) {
      filter.category = req.query.category;
    }

    const posts = await Post.find(filter)
      .populate('author', 'name role ward')
      .populate('comments.author', 'name role')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/community/:id  — Get a single post with all comments
const getPostById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid post ID' });
  }

  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name role ward')
      .populate('comments.author', 'name role');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/community/:id/comments  — Add a comment to a post
const addComment = async (req, res) => {
  const { content } = req.body;

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid post ID' });
  }
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ message: 'Comment content cannot be empty' });
  }

  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({ author: req.user._id, content: content.trim() });
    await post.save();

    const populated = await Post.findById(post._id)
      .populate('author', 'name role ward')
      .populate('comments.author', 'name role');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/community/:id  — Delete a post (own author or admin)
const deletePost = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid post ID' });
  }

  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const isOwner = post.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/community/:id/comments/:commentId  — Delete a comment (own author or admin)
const deleteComment = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(req.params.commentId)) {
    return res.status(400).json({ message: 'Invalid post or comment ID' });
  }

  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const isOwner = comment.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    comment.deleteOne();
    await post.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPost, getAllPosts, getPostById, addComment, deletePost, deleteComment };
