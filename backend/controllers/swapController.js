const SwapRequest = require('../models/SwapRequest');
const Notification = require('../models/Notification');
const Roster = require('../models/Roster');
const mongoose = require('mongoose');

const VALID_SHIFTS = ['7AM-1PM', '1PM-7PM', '7AM-7PM', '7PM-7AM'];

// @POST /api/swap
const createSwap = async (req, res) => {
  const { targetNurse, requesterShiftDate, requesterShift, targetShiftDate, targetShift, reason } = req.body;

  // --- Validation ---
  if (!targetNurse || !requesterShiftDate || !requesterShift || !targetShiftDate || !targetShift) {
    return res.status(400).json({ message: 'Please provide targetNurse, both shift dates, and both shifts' });
  }
  if (!mongoose.Types.ObjectId.isValid(targetNurse)) {
    return res.status(400).json({ message: 'Invalid target nurse ID' });
  }
  if (targetNurse === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot send a swap request to yourself' });
  }
  if (!VALID_SHIFTS.includes(requesterShift) || !VALID_SHIFTS.includes(targetShift)) {
    return res.status(400).json({ message: `Shifts must be one of: ${VALID_SHIFTS.join(', ')}` });
  }
  // ------------------

  try {
    const swap = await SwapRequest.create({
      requester: req.user._id,
      targetNurse,
      requesterShiftDate,
      requesterShift,
      targetShiftDate,
      targetShift,
      reason: reason || '',
    });

    await Notification.create({
      recipient: targetNurse,
      message: `${req.user.name} has sent you a shift swap request for ${requesterShiftDate}.`,
      type: 'swap',
    });

    res.status(201).json(swap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/swap/my
const getMySwaps = async (req, res) => {
  try {
    const filter = {
      $or: [{ requester: req.user._id }, { targetNurse: req.user._id }],
    };
    if (req.query.status && ['pending', 'approved', 'rejected'].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const swaps = await SwapRequest.find(filter)
      .populate('requester', 'name email ward')
      .populate('targetNurse', 'name email ward')
      .sort({ createdAt: -1 });
    res.json(swaps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PUT /api/swap/:id  ← FIX 4: Now actually swaps the roster entries
const respondToSwap = async (req, res) => {
  const { status } = req.body;

  // --- Validation ---
  if (!status) {
    return res.status(400).json({ message: 'Please provide a status (approved or rejected)' });
  }
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be either approved or rejected' });
  }
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid swap request ID' });
  }
  // ------------------

  try {
    const swap = await SwapRequest.findById(req.params.id)
      .populate('requester', 'name')
      .populate('targetNurse', 'name');

    if (!swap) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    // Only the target nurse can respond
    if (swap.targetNurse._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the target nurse can respond to this request' });
    }

    // Only pending requests can be responded to
    if (swap.status !== 'pending') {
      return res.status(400).json({ message: `This swap request is already ${swap.status}` });
    }

    swap.status = status;
    await swap.save();

    // ✅ FIX 4: If approved, update the actual roster entries
    if (status === 'approved') {
      // Find requester's roster entry for that date
      const requesterRosterEntry = await Roster.findOne({
        nurse: swap.requester._id,
        date: swap.requesterShiftDate,
      });

      // Find target nurse's roster entry for that date
      const targetRosterEntry = await Roster.findOne({
        nurse: swap.targetNurse._id,
        date: swap.targetShiftDate,
      });

      // Swap the nurse fields in both roster entries
      if (requesterRosterEntry && targetRosterEntry) {
        requesterRosterEntry.nurse = swap.targetNurse._id;
        targetRosterEntry.nurse = swap.requester._id;
        await requesterRosterEntry.save();
        await targetRosterEntry.save();
      }
    }

    // Notify the requester of the response
    await Notification.create({
      recipient: swap.requester._id,
      message: `Your shift swap request for ${swap.requesterShiftDate} has been ${status} by ${req.user.name}.`,
      type: 'swap',
    });

    res.json({
      message: `Swap request ${status} successfully`,
      swap,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createSwap, getMySwaps, respondToSwap };