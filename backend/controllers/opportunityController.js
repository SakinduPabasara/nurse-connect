const Opportunity = require('../models/Opportunity');
const mongoose = require('mongoose');

const VALID_TYPES = ['international', 'local', 'training', 'certification'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// @POST /api/opportunities  — Admin creates an opportunity
const createOpportunity = async (req, res) => {
  const { title, description, type, location, deadline } = req.body;

  if (!title || !description || !type) {
    return res.status(400).json({ message: 'Please provide title, description, and type' });
  }
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ message: `type must be one of: ${VALID_TYPES.join(', ')}` });
  }
  if (deadline && !DATE_REGEX.test(deadline)) {
    return res.status(400).json({ message: 'deadline must be in YYYY-MM-DD format' });
  }

  try {
    const opportunity = await Opportunity.create({
      title: title.trim(),
      description: description.trim(),
      type,
      location: location ? location.trim() : '',
      deadline: deadline || '',
      postedBy: req.user._id,
    });

    const populated = await opportunity.populate('postedBy', 'name');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/opportunities  — All authenticated users view opportunities
const getAllOpportunities = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type && VALID_TYPES.includes(req.query.type)) {
      filter.type = req.query.type;
    }

    const opportunities = await Opportunity.find(filter)
      .populate('postedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(opportunities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/opportunities/:id  — Get a single opportunity
const getOpportunityById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid opportunity ID' });
  }

  try {
    const opportunity = await Opportunity.findById(req.params.id).populate('postedBy', 'name');
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    res.json(opportunity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/opportunities/:id  — Admin deletes an opportunity
const deleteOpportunity = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid opportunity ID' });
  }

  try {
    const opportunity = await Opportunity.findByIdAndDelete(req.params.id);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    res.json({ message: 'Opportunity deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createOpportunity, getAllOpportunities, getOpportunityById, deleteOpportunity };
