const TransferRequest = require('../models/TransferRequest');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { getIO } = require('../utils/socketManager');
// @POST /api/transfers  — Nurse posts a transfer request
const createTransfer = async (req, res) => {
  const { currentHospital, currentWard, desiredHospital, desiredWard, transferTimeframe, reason } = req.body;

  if (!currentHospital || !currentWard || !desiredHospital || !transferTimeframe) {
    return res.status(400).json({
      message: 'Please provide currentHospital, currentWard, desiredHospital, and transferTimeframe',
    });
  }

  try {
    const transfer = await TransferRequest.create({
      requester: req.user._id,
      currentHospital: currentHospital.trim(),
      currentWard: currentWard.trim(),
      desiredHospital: desiredHospital.trim(),
      desiredWard: desiredWard ? desiredWard.trim() : '',
      transferTimeframe: transferTimeframe.trim(),
      reason: reason || '',
    });

    const populated = await transfer.populate('requester', 'name email ward hospital');
    
    try {
      getIO().to('all_users').emit('transfer:updated');
    } catch (err) {
      console.error('Socket emit error:', err.message);
    }
    
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/transfers/my  — Nurse views own transfer requests
const getMyTransfers = async (req, res) => {
  try {
    const filter = { requester: req.user._id };
    if (req.query.status && ['open', 'matched', 'closed'].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const transfers = await TransferRequest.find(filter)
      .populate('requester', 'name email ward hospital')
      .populate('matchedWith', 'name email ward hospital')
      .sort({ createdAt: -1 });
    res.json(transfers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/transfers  — Any authenticated user views all open requests
const getAllTransfers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && ['open', 'matched', 'closed'].includes(req.query.status)) {
      filter.status = req.query.status;
    } else {
      filter.status = 'open'; // Default: only show open requests
    }

    const transfers = await TransferRequest.find(filter)
      .populate('requester', 'name email ward hospital')
      .populate('matchedWith', 'name email ward hospital')
      .sort({ createdAt: -1 });
    res.json(transfers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/transfers/matches  — Find mutual matches for the logged-in nurse
// Logic: find open requests where:
//   - desiredHospital === nurse's current hospital AND
//   - currentHospital === nurse's desired hospital (from their own open request)
const getMatchingTransfers = async (req, res) => {
  try {
    // Get the current nurse's open transfer requests
    const myRequests = await TransferRequest.find({
      requester: req.user._id,
      status: 'open',
    });

    if (myRequests.length === 0) {
      return res.json([]); // Always return an array for the frontend
    }

    const matchSet = new Map(); // deduplicate by _id

    for (const myReq of myRequests) {
      // Find others who want to go where I am, and are currently where I want to go
      const potentialMatches = await TransferRequest.find({
        requester: { $ne: req.user._id },
        status: 'open',
        currentHospital: myReq.desiredHospital,
        desiredHospital: myReq.currentHospital,
      }).populate('requester', 'name email ward hospital');

      potentialMatches.forEach(m => matchSet.set(m._id.toString(), m));
    }

    res.json([...matchSet.values()]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PUT /api/transfers/:id  — Update status (admin or requester can close; anyone can mark matched)
const updateTransferStatus = async (req, res) => {
  const { status, matchedWithUserId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid transfer request ID' });
  }
  if (!status || !['open', 'matched', 'closed'].includes(status)) {
    return res.status(400).json({ message: 'Status must be one of: open, matched, closed' });
  }
  if (status === 'matched' && matchedWithUserId && !mongoose.Types.ObjectId.isValid(matchedWithUserId)) {
    return res.status(400).json({ message: 'Invalid matchedWithUserId' });
  }

  try {
    const transfer = await TransferRequest.findById(req.params.id).populate('requester', 'name');
    if (!transfer) return res.status(404).json({ message: 'Transfer request not found' });

    const isOwner = transfer.requester._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this transfer request' });
    }

    transfer.status = status;

    // Record who this matched with when status is 'matched'
    if (status === 'matched' && matchedWithUserId) {
      transfer.matchedWith = matchedWithUserId;
    }

    await transfer.save();

    // Notify requester if not the one making this change
    if (!isOwner) {
      const notif = await Notification.create({
        recipient: transfer.requester._id,
        message: `Your transfer request to ${transfer.desiredHospital} has been updated to: ${status}.`,
        type: 'transfer',
      });
      try {
        getIO().to('user:' + transfer.requester._id.toString()).emit('notification:new', notif);
        getIO().to('all_users').emit('transfer:updated');
      } catch (err) {
        console.error('Socket emit error:', err.message);
      }
    }

    try {
      getIO().to('all_users').emit('transfer:updated');
    } catch (err) {
      console.error('Socket emit error:', err.message);
    }

    res.json({ message: `Transfer request updated to ${status}`, transfer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTransfer, getMyTransfers, getAllTransfers, getMatchingTransfers, updateTransferStatus };
