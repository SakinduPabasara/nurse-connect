const SwapRequest = require('../models/SwapRequest');
const Notification = require('../models/Notification');

// @POST /api/swap  — Create swap request
const createSwap = async (req, res) => {
  const { targetNurse, requesterShiftDate, requesterShift, targetShiftDate, targetShift, reason } = req.body;
  try {
    const swap = await SwapRequest.create({
      requester: req.user._id,
      targetNurse,
      requesterShiftDate,
      requesterShift,
      targetShiftDate,
      targetShift,
      reason,
    });

    // Send notification to target nurse
    await Notification.create({
      recipient: targetNurse,
      message: `${req.user.name} has sent you a shift swap request.`,
      type: 'swap',
    });

    res.status(201).json(swap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/swap/my  — Get my swap requests
const getMySwaps = async (req, res) => {
  try {
    const swaps = await SwapRequest.find({
      $or: [{ requester: req.user._id }, { targetNurse: req.user._id }],
    })
      .populate('requester', 'name')
      .populate('targetNurse', 'name')
      .sort({ createdAt: -1 });
    res.json(swaps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PUT /api/swap/:id  — Approve or Reject
const respondToSwap = async (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'
  try {
    const swap = await SwapRequest.findById(req.params.id).populate('requester', 'name');
    if (!swap) return res.status(404).json({ message: 'Swap request not found' });

    swap.status = status;
    await swap.save();

    // Notify the original requester
    await Notification.create({
      recipient: swap.requester._id,
      message: `Your swap request has been ${status} by ${req.user.name}.`,
      type: 'swap',
    });

    res.json(swap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createSwap, getMySwaps, respondToSwap };