const Overtime = require('../models/Overtime');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { getIO } = require('../utils/socketManager');
const User = require('../models/User');
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const VALID_SHIFTS = ['morning', 'evening', 'night', 'custom'];

/* ─────────────────────────────────────────────────────── helpers ── */
const todayStr = () => new Date().toISOString().split('T')[0];

const threeMonthsAgoStr = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString().split('T')[0];
};

/* ═══════════════════════════════════════════════════════════════════
   @POST /api/overtime  — Nurse submits an OT application
   Body: { date, shift, extraHours, reason }
═══════════════════════════════════════════════════════════════════ */
const applyOvertime = async (req, res) => {
  const { date, shift, extraHours, reason } = req.body;

  /* ── field presence ── */
  if (!date || extraHours === undefined) {
    return res.status(400).json({ message: 'date and extraHours are required.' });
  }

  /* ── date format ── */
  if (!DATE_REGEX.test(date)) {
    return res.status(400).json({ message: 'date must be in YYYY-MM-DD format.' });
  }

  /* ── date range: cannot be future ── */
  if (date > todayStr()) {
    return res.status(400).json({ message: 'Cannot apply OT for a future date.' });
  }

  /* ── date range: not more than 3 months ago ── */
  if (date < threeMonthsAgoStr()) {
    return res.status(400).json({ message: 'Cannot apply OT for dates more than 3 months ago.' });
  }

  /* ── hours validation ── */
  const hours = Number(extraHours);
  if (isNaN(hours) || hours < 0.5) {
    return res.status(400).json({ message: 'extraHours must be at least 0.5.' });
  }
  if (hours > 24) {
    return res.status(400).json({ message: 'extraHours cannot exceed 24.' });
  }

  /* ── shift ── */
  const shiftVal = shift && VALID_SHIFTS.includes(shift) ? shift : 'custom';

  try {
    /* ── prevent duplicate (same nurse + date + shift) ── */
    const existing = await Overtime.findOne({
      nurse: req.user._id,
      date,
      shift: shiftVal,
    });
    if (existing) {
      return res.status(409).json({
        message: `You already have a ${shiftVal} shift OT application for ${date}.`,
      });
    }

    const record = await Overtime.create({
      nurse: req.user._id,
      date,
      shift: shiftVal,
      extraHours: hours,
      reason: reason || '',
      status: 'pending',
    });

    const populated = await record.populate('nurse', 'name email ward hospital');
    
    // Notify all admins via DB Notification
    const admins = await User.find({ role: 'admin' }).select('_id');
    const shiftLabel = { morning: 'Morning', evening: 'Evening', night: 'Night', custom: 'Custom' }[shiftVal] || shiftVal;
    const adminNotifs = admins.map(a => ({
      recipient: a._id,
      message: `${req.user.name} applied for OT on ${date} (${shiftLabel} shift, ${hours}h).`,
      type: 'overtime'
    }));
    if (adminNotifs.length > 0) {
      await Notification.insertMany(adminNotifs);
    }
    
    try {
      getIO().to('admin').emit('overtime:created', populated);
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

/* ═══════════════════════════════════════════════════════════════════
   @DELETE /api/overtime/withdraw/:id  — Nurse withdraws own pending OT
═══════════════════════════════════════════════════════════════════ */
const withdrawOvertime = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid overtime record ID.' });
  }

  try {
    const record = await Overtime.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Overtime record not found.' });
    }
    if (record.nurse.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to withdraw this record.' });
    }
    if (record.status !== 'pending') {
      return res.status(409).json({ message: 'Only pending applications can be withdrawn.' });
    }

    await record.deleteOne();
    
    try {
      getIO().to('admin').emit('overtime:deleted', record._id);
    } catch (err) {
      console.error('Socket emit error:', err.message);
    }
    
    res.json({ message: 'OT application withdrawn successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ═══════════════════════════════════════════════════════════════════
   @GET /api/overtime/my  — Nurse views own OT records with stats
═══════════════════════════════════════════════════════════════════ */
const getMyOvertime = async (req, res) => {
  try {
    const records = await Overtime.find({ nurse: req.user._id })
      .populate('reviewedBy', 'name')
      .sort({ date: -1 });

    const approved = records.filter((r) => r.status === 'approved');
    const totalApprovedHours = approved.reduce((sum, r) => sum + r.extraHours, 0);
    const pendingCount = records.filter((r) => r.status === 'pending').length;

    res.json({ totalApprovedHours, pendingCount, records });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ═══════════════════════════════════════════════════════════════════
   @GET /api/overtime  — Admin views all OT records (with optional filters)
   Query: ?nurse=<id>&status=pending|approved|rejected
═══════════════════════════════════════════════════════════════════ */
const getAllOvertime = async (req, res) => {
  try {
    const filter = {};
    if (req.query.nurse && mongoose.Types.ObjectId.isValid(req.query.nurse)) {
      filter.nurse = req.query.nurse;
    }
    if (req.query.status && ['pending', 'approved', 'rejected'].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const records = await Overtime.find(filter)
      .populate('nurse', 'name email ward hospital')
      .populate('reviewedBy', 'name')
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ═══════════════════════════════════════════════════════════════════
   @PUT /api/overtime/:id  — Admin approves or rejects an OT application
   Body: { status: 'approved'|'rejected', adminNote?: string, approvedAmount?: number }
   approvedAmount — custom LKR payout set by admin (required when status=approved)
═══════════════════════════════════════════════════════════════════ */
const reviewOvertime = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid overtime record ID.' });
  }

  const { status, adminNote, approvedAmount } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'status must be "approved" or "rejected".' });
  }

  /* Validate approvedAmount when approving */
  if (status === 'approved') {
    if (approvedAmount === undefined || approvedAmount === null) {
      return res.status(400).json({ message: 'approvedAmount is required when approving.' });
    }
    const amt = Number(approvedAmount);
    if (isNaN(amt) || amt < 0) {
      return res.status(400).json({ message: 'approvedAmount must be a non-negative number.' });
    }
  }

  try {
    const record = await Overtime.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Overtime record not found.' });
    }
    if (record.status !== 'pending') {
      return res.status(409).json({
        message: `This application has already been ${record.status}.`,
      });
    }

    record.status = status;
    record.adminNote = adminNote || '';
    record.reviewedBy = req.user._id;
    record.reviewedAt = new Date();
    if (status === 'approved') {
      record.approvedAmount = Number(approvedAmount);
    } else {
      record.approvedAmount = null; // clear if rejecting
    }
    await record.save();

    const populated = await record.populate([
      { path: 'nurse', select: 'name email ward hospital' },
      { path: 'reviewedBy', select: 'name' },
    ]);

    /* ── Fire notification to the nurse ── */
    try {
      const shiftLabel = { morning: 'Morning', evening: 'Evening', night: 'Night', custom: 'Custom' }[record.shift] || record.shift;
      let notifMessage;
      if (status === 'approved') {
        notifMessage =
          `✅ Your overtime application for ${record.date} (${shiftLabel} shift, ${record.extraHours}h) has been approved.` +
          ` Approved amount: LKR ${Number(approvedAmount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}.` +
          (record.adminNote ? ` Note: ${record.adminNote}` : '');
      } else {
        notifMessage =
          `❌ Your overtime application for ${record.date} (${shiftLabel} shift, ${record.extraHours}h) has been rejected.` +
          (record.adminNote ? ` Reason: ${record.adminNote}` : ' No reason was provided.');
      }
      const notif = await Notification.create({
        recipient: record.nurse,
        message: notifMessage,
        type: 'overtime',
      });
      getIO().to('user:' + record.nurse.toString()).emit('notification:new', notif);
      getIO().to('user:' + record.nurse.toString()).emit('overtime:updated', populated);
      getIO().to('admin').emit('overtime:updated', populated);
    } catch (notifErr) {
      // Non-fatal — log but don't fail the response
      console.error('[OT Notification] Failed to create notification:', notifErr.message);
    }

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ═══════════════════════════════════════════════════════════════════
   @DELETE /api/overtime/:id  — Admin hard-deletes an OT record
═══════════════════════════════════════════════════════════════════ */
const deleteOvertime = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid overtime record ID.' });
  }

  try {
    const record = await Overtime.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Overtime record not found.' });
    }
    
    try {
      getIO().to('admin').emit('overtime:deleted', record._id);
      getIO().to('user:' + record.nurse.toString()).emit('overtime:deleted', record._id);
    } catch (err) {
      console.error('Socket emit error:', err.message);
    }
    
    res.json({ message: 'Overtime record deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  applyOvertime,
  withdrawOvertime,
  getMyOvertime,
  getAllOvertime,
  reviewOvertime,
  deleteOvertime,
};
