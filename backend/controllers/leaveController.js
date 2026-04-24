const Leave = require('../models/Leave');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { getIO } = require('../utils/socketManager');
const User = require('../models/User');

const VALID_TYPES = ['annual', 'sick', 'casual', 'overtime_comp'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// @POST /api/leave  — Nurse applies for leave
const applyLeave = async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;

  if (!leaveType || !startDate || !endDate) {
    return res.status(400).json({ message: 'Please provide leaveType, startDate, and endDate' });
  }
  if (!VALID_TYPES.includes(leaveType)) {
    return res.status(400).json({ message: `leaveType must be one of: ${VALID_TYPES.join(', ')}` });
  }
  if (!DATE_REGEX.test(startDate) || !DATE_REGEX.test(endDate)) {
    return res.status(400).json({ message: 'startDate and endDate must be in YYYY-MM-DD format' });
  }
  if (new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ message: 'endDate cannot be before startDate' });
  }

  try {
    const leave = await Leave.create({
      nurse: req.user._id,
      leaveType,
      startDate,
      endDate,
      reason: reason || '',
    });

    const populated = await leave.populate('nurse', 'name email ward');
    
    // Notify all admins via DB Notification
    const admins = await User.find({ role: 'admin' }).select('_id');
    const adminNotifs = admins.map(a => ({
      recipient: a._id,
      message: `${req.user.name} applied for ${leaveType} leave from ${startDate} to ${endDate}.`,
      type: 'leave'
    }));
    if (adminNotifs.length > 0) {
      await Notification.insertMany(adminNotifs);
    }
    
    try {
      getIO().to('admin').emit('leave:created', populated);
      // For the notification bell badge updates
      adminNotifs.forEach(n => {
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

// @GET /api/leave/my  — Nurse views own leave history
const getMyLeave = async (req, res) => {
  try {
    const filter = { nurse: req.user._id };
    if (req.query.status && ['pending', 'approved', 'rejected'].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const leaves = await Leave.find(filter)
      .populate('nurse', 'name email')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/leave  — Admin views all leave requests
const getAllLeave = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && ['pending', 'approved', 'rejected'].includes(req.query.status)) {
      filter.status = req.query.status;
    }
    if (req.query.nurse && mongoose.Types.ObjectId.isValid(req.query.nurse)) {
      filter.nurse = req.query.nurse;
    }

    const leaves = await Leave.find(filter)
      .populate('nurse', 'name email ward hospital')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PUT /api/leave/:id  — Admin approves or rejects a leave request
const updateLeaveStatus = async (req, res) => {
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid leave ID' });
  }
  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be either approved or rejected' });
  }

  try {
    const leave = await Leave.findById(req.params.id).populate('nurse', 'name');
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });
    if (leave.status !== 'pending') {
      return res.status(400).json({ message: `This leave request is already ${leave.status}` });
    }

    leave.status = status;
    leave.reviewedBy = req.user._id;
    await leave.save();

    // Notify the nurse
    const notif = await Notification.create({
      recipient: leave.nurse._id,
      message: `Your leave request from ${leave.startDate} to ${leave.endDate} has been ${status}.`,
      type: 'leave',
    });

    try {
      getIO().to('user:' + leave.nurse._id.toString()).emit('notification:new', notif);
      getIO().to('user:' + leave.nurse._id.toString()).emit('leave:updated', leave);
      getIO().to('admin').emit('leave:updated', leave);
    } catch (err) {
      console.error('Socket emit error:', err.message);
    }

    res.json({ message: `Leave request ${status} successfully`, leave });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { applyLeave, getMyLeave, getAllLeave, updateLeaveStatus };
