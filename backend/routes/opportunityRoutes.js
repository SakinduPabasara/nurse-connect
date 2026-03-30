const express = require('express');
const router = express.Router();
const {
  createOpportunity, getAllOpportunities, getOpportunityById, deleteOpportunity
} = require('../controllers/opportunityController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, adminOnly, createOpportunity);  // Admin only
router.get('/', protect, getAllOpportunities);
router.get('/:id', protect, getOpportunityById);
router.delete('/:id', protect, adminOnly, deleteOpportunity);

module.exports = router;
