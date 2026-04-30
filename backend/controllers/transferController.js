const TransferRequest = require('../models/TransferRequest');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { getIO } = require('../utils/socketManager');
const User = require('../models/User');
const Roster = require('../models/Roster');
const SwapRequest = require('../models/SwapRequest');
const Leave = require('../models/Leave');
const Overtime = require('../models/Overtime');

const VALID_STATUSES = ['open', 'approved', 'rejected', 'cancelled'];

const todayISO = () => new Date().toISOString().split('T')[0];
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

    // Notify admins about new transfer requests
    const admins = await User.find({ role: 'admin' }).select('_id');
    const adminNotifs = admins.map((a) => ({
      recipient: a._id,
      message: `${req.user.name} requested a hospital transfer to ${transfer.desiredHospital} (${transfer.transferTimeframe}).`,
      type: 'transfer',
    }));
    if (adminNotifs.length > 0) {
      await Notification.insertMany(adminNotifs);
    }

    try {
      getIO().to('all_users').emit('transfer:updated');
      getIO().to('admin').emit('transfer:updated');
      adminNotifs.forEach((n) => {
        getIO().to('admin').emit('notification:new', { ...n, isRead: false, createdAt: new Date() });
      });
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
    if (req.query.status && VALID_STATUSES.includes(req.query.status)) {
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
    if (req.query.status && VALID_STATUSES.includes(req.query.status)) {
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
        transferTimeframe: myReq.transferTimeframe,
      }).populate('requester', 'name email ward hospital');

      potentialMatches.forEach(m => matchSet.set(m._id.toString(), m));
    }

    res.json([...matchSet.values()]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PUT /api/transfers/:id  — Requester can cancel their own open request
const updateTransferStatus = async (req, res) => {
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid transfer request ID' });
  }
  if (!status || !['cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Status must be: cancelled' });
  }

  try {
    const transfer = await TransferRequest.findById(req.params.id).populate('requester', 'name');
    if (!transfer) return res.status(404).json({ message: 'Transfer request not found' });

    const isOwner = transfer.requester._id.toString() === req.user._id.toString();
    if (!isOwner) {
      return res.status(403).json({ message: 'Not authorized to update this transfer request' });
    }
    if (transfer.status !== 'open') {
      return res.status(400).json({ message: `This request is already ${transfer.status}` });
    }

    transfer.status = 'cancelled';
    transfer.cancelledAt = new Date();
    await transfer.save();

    try {
      getIO().to('all_users').emit('transfer:updated');
      getIO().to('admin').emit('transfer:updated');
    } catch (err) {
      console.error('Socket emit error:', err.message);
    }

    res.json({ message: 'Transfer request cancelled', transfer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/transfers/approve-pair  — Admin approves reciprocal transfers
const approveTransferPair = async (req, res) => {
  const { requestAId, requestBId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(requestAId) || !mongoose.Types.ObjectId.isValid(requestBId)) {
    return res.status(400).json({ message: 'Invalid transfer request ID(s)' });
  }
  if (requestAId === requestBId) {
    return res.status(400).json({ message: 'Pair must contain two different requests' });
  }

  try {
    const [reqA, reqB] = await Promise.all([
      TransferRequest.findById(requestAId).populate('requester', 'name hospital ward'),
      TransferRequest.findById(requestBId).populate('requester', 'name hospital ward'),
    ]);

    if (!reqA || !reqB) return res.status(404).json({ message: 'Transfer request not found' });
    if (reqA.status !== 'open' || reqB.status !== 'open') {
      return res.status(400).json({ message: 'Both requests must be open to approve' });
    }
    if (reqA.requester._id.toString() === reqB.requester._id.toString()) {
      return res.status(400).json({ message: 'Cannot approve two requests from the same user' });
    }
    if (reqA.transferTimeframe !== reqB.transferTimeframe) {
      return res.status(400).json({ message: 'Requests must have the same timeframe to match' });
    }

    const reciprocal =
      reqA.currentHospital === reqB.desiredHospital &&
      reqB.currentHospital === reqA.desiredHospital;
    if (!reciprocal) {
      return res.status(400).json({ message: 'Requests are not reciprocal between hospitals' });
    }

    const now = new Date();
    const today = todayISO();

    // Update both users
    await Promise.all([
      User.findByIdAndUpdate(reqA.requester._id, { $set: { hospital: reqA.desiredHospital, ward: '' } }),
      User.findByIdAndUpdate(reqB.requester._id, { $set: { hospital: reqB.desiredHospital, ward: '' } }),
    ]);

    // Cleanup future rosters
    await Promise.all([
      Roster.deleteMany({ nurse: reqA.requester._id, date: { $gte: today } }),
      Roster.deleteMany({ nurse: reqB.requester._id, date: { $gte: today } }),
    ]);

    // Cancel pending swap requests involving either user
    await SwapRequest.updateMany(
      {
        status: 'pending',
        $or: [
          { requester: reqA.requester._id },
          { targetNurse: reqA.requester._id },
          { requester: reqB.requester._id },
          { targetNurse: reqB.requester._id },
        ],
      },
      { $set: { status: 'rejected' } },
    );

    // Cancel pending leave requests
    await Leave.updateMany(
      { nurse: reqA.requester._id, status: 'pending' },
      { $set: { status: 'rejected', reviewedBy: req.user._id } },
    );
    await Leave.updateMany(
      { nurse: reqB.requester._id, status: 'pending' },
      { $set: { status: 'rejected', reviewedBy: req.user._id } },
    );

    // Remove pending overtime entries
    await Overtime.deleteMany({ nurse: reqA.requester._id, status: 'pending' });
    await Overtime.deleteMany({ nurse: reqB.requester._id, status: 'pending' });

    // Approve the pair
    reqA.status = 'approved';
    reqA.matchedWith = reqB.requester._id;
    reqA.approvedAt = now;
    reqA.decidedBy = req.user._id;
    await reqA.save();

    reqB.status = 'approved';
    reqB.matchedWith = reqA.requester._id;
    reqB.approvedAt = now;
    reqB.decidedBy = req.user._id;
    await reqB.save();

    // Cancel any other open requests for these users
    await TransferRequest.updateMany(
      {
        requester: { $in: [reqA.requester._id, reqB.requester._id] },
        status: 'open',
        _id: { $nin: [reqA._id, reqB._id] },
      },
      { $set: { status: 'cancelled', cancelledAt: now, decidedBy: req.user._id } },
    );

    // Notify the two users
    const notifA = await Notification.create({
      recipient: reqA.requester._id,
      message: `Your transfer to ${reqA.desiredHospital} has been approved. Your ward assignment will be updated by an admin shortly.`,
      type: 'transfer',
    });
    const notifB = await Notification.create({
      recipient: reqB.requester._id,
      message: `Your transfer to ${reqB.desiredHospital} has been approved. Your ward assignment will be updated by an admin shortly.`,
      type: 'transfer',
    });

    // Notify the approving admin
    const adminNotif = await Notification.create({
      recipient: req.user._id,
      message: `Transfer approved: ${reqA.requester.name} ↔ ${reqB.requester.name} (${reqA.currentHospital} ⇄ ${reqA.desiredHospital}).`,
      type: 'transfer',
    });

    try {
      getIO().to('user:' + reqA.requester._id.toString()).emit('notification:new', notifA);
      getIO().to('user:' + reqB.requester._id.toString()).emit('notification:new', notifB);
      getIO().to('user:' + req.user._id.toString()).emit('notification:new', adminNotif);

      getIO().to('user:' + reqA.requester._id.toString()).emit('transfer:updated');
      getIO().to('user:' + reqB.requester._id.toString()).emit('transfer:updated');
      getIO().to('admin').emit('transfer:updated');
      getIO().to('all_users').emit('transfer:updated');

      const [userA, userB] = await Promise.all([
        User.findById(reqA.requester._id).select('-password'),
        User.findById(reqB.requester._id).select('-password'),
      ]);
      if (userA) getIO().to('user:' + userA._id.toString()).emit('user:updated', userA);
      if (userB) getIO().to('user:' + userB._id.toString()).emit('user:updated', userB);
      getIO().to('admin').emit('user:updated', userA);
      getIO().to('admin').emit('user:updated', userB);
    } catch (err) {
      console.error('Socket emit error:', err.message);
    }

    res.json({ message: 'Transfer pair approved', approved: [reqA, reqB] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PUT /api/transfers/:id/reject  — Admin rejects a single request
const rejectTransfer = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid transfer request ID' });
  }

  try {
    const transfer = await TransferRequest.findById(req.params.id).populate('requester', 'name');
    if (!transfer) return res.status(404).json({ message: 'Transfer request not found' });
    if (transfer.status !== 'open') {
      return res.status(400).json({ message: `This request is already ${transfer.status}` });
    }

    transfer.status = 'rejected';
    transfer.rejectedAt = new Date();
    transfer.decidedBy = req.user._id;
    await transfer.save();

    const notif = await Notification.create({
      recipient: transfer.requester._id,
      message: `Your transfer request to ${transfer.desiredHospital} has been rejected by admin.`,
      type: 'transfer',
    });

    const adminNotif = await Notification.create({
      recipient: req.user._id,
      message: `Transfer rejected: ${transfer.requester.name} → ${transfer.desiredHospital}.`,
      type: 'transfer',
    });

    try {
      getIO().to('user:' + transfer.requester._id.toString()).emit('notification:new', notif);
      getIO().to('user:' + req.user._id.toString()).emit('notification:new', adminNotif);
      getIO().to('admin').emit('transfer:updated');
      getIO().to('all_users').emit('transfer:updated');
    } catch (err) {
      console.error('Socket emit error:', err.message);
    }

    res.json({ message: 'Transfer request rejected', transfer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTransfer,
  getMyTransfers,
  getAllTransfers,
  getMatchingTransfers,
  updateTransferStatus,
  approveTransferPair,
  rejectTransfer,
};
