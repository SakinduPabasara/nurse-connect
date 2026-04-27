const SwapRequest = require('../models/SwapRequest');
const Notification = require('../models/Notification');
const Roster = require('../models/Roster');
const mongoose = require('mongoose');
const User = require('../models/User');
const { getIO } = require('../utils/socketManager');

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
    const target = await User.findById(targetNurse);
    if (!target) return res.status(404).json({ message: 'Target nurse not found' });
    
    // Strict ward-based validation
    if (target.ward !== req.user.ward) {
      return res.status(400).json({ message: 'You can only request a swap with a nurse in your same ward' });
    }

    // Verify the requester actually owns that roster entry
    const myRosterEntry = await Roster.findOne({
      nurse: req.user._id,
      date: requesterShiftDate,
      shift: requesterShift,
    });
    if (!myRosterEntry) {
      return res.status(400).json({ message: `You do not have a "${requesterShift}" shift assigned on ${requesterShiftDate}. You can only request a swap for your actual assigned shifts.` });
    }

    // Verify the target nurse actually owns that roster entry
    const targetRosterEntry = await Roster.findOne({
      nurse: targetNurse,
      date: targetShiftDate,
      shift: targetShift,
    });
    if (!targetRosterEntry) {
      return res.status(400).json({ message: `The target nurse does not have a "${targetShift}" shift assigned on ${targetShiftDate}.` });
    }

    const swap = await SwapRequest.create({
      requester: req.user._id,
      targetNurse,
      requesterShiftDate,
      requesterShift,
      targetShiftDate,
      targetShift,
      reason: reason || '',
    });

    const notif = await Notification.create({
      recipient: targetNurse,
      message: `${req.user.name} has sent you a shift swap request for ${requesterShiftDate}.`,
      type: 'swap',
    });

    try {
      getIO().to('user:' + targetNurse.toString()).emit('notification:new', notif);
      getIO().to('user:' + targetNurse.toString()).emit('swap:updated');
    } catch (err) {
      console.error('Socket emit error:', err.message);
    }

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

// @GET /api/swap
const getAllSwaps = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && ['pending', 'approved', 'rejected'].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const swaps = await SwapRequest.find(filter)
      .populate('requester', 'name email ward nic hospital')
      .populate('targetNurse', 'name email ward nic hospital')
      .sort({ createdAt: -1 });
    res.json(swaps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PUT /api/swap/:id
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
      .populate('requester', 'name ward')
      .populate('targetNurse', 'name ward');

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

    let rosterWarning = null;

    // If approved, perform the actual roster swap
    if (status === 'approved') {
      // Find the requester's roster entry matching their offered shift date
      const requesterRosterEntry = await Roster.findOne({
        nurse: swap.requester._id,
        date: swap.requesterShiftDate,
      });

      // Find the target nurse's roster entry matching their offered shift date
      const targetRosterEntry = await Roster.findOne({
        nurse: swap.targetNurse._id,
        date: swap.targetShiftDate,
      });

      if (requesterRosterEntry && targetRosterEntry) {
        // Swap the nurse assignments on each entry
        // Requester's slot → now assigned to target nurse (with target nurse's ward)
        requesterRosterEntry.nurse = swap.targetNurse._id;
        requesterRosterEntry.ward  = swap.targetNurse.ward;

        // Target's slot → now assigned to requester (with requester's ward)
        targetRosterEntry.nurse = swap.requester._id;
        targetRosterEntry.ward  = swap.requester.ward;

        await requesterRosterEntry.save();
        await targetRosterEntry.save();
      } else {
        // Swap approved but no matching roster records — log for visibility
        rosterWarning = 'Swap approved but no matching roster entries were found for the specified dates. Roster was not automatically updated.';
        console.warn(`[SWAP] ${rosterWarning} Swap ID: ${swap._id}`);
      }
    }

    // Notify the requester of the response
    const notif = await Notification.create({
      recipient: swap.requester._id,
      message: `Your shift swap request for ${swap.requesterShiftDate} has been ${status} by ${req.user.name}.`,
      type: 'swap',
    });

    try {
      getIO().to('user:' + swap.requester._id.toString()).emit('notification:new', notif);
      getIO().to('user:' + swap.requester._id.toString()).emit('swap:updated');
      if (status === 'approved') {
        // Trigger roster refresh on both sides so their My Roster updates in real-time
        getIO().to('user:' + swap.requester._id.toString()).emit('roster:updated');
        getIO().to('user:' + swap.targetNurse._id.toString()).emit('roster:updated');
      }
    } catch (err) {
      console.error('Socket emit error:', err.message);
    }

    res.json({
      message: `Swap request ${status} successfully`,
      swap,
      ...(rosterWarning && { warning: rosterWarning }),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createSwap, getMySwaps, respondToSwap, getAllSwaps };