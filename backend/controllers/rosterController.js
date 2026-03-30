const Roster = require('../models/Roster');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

const VALID_SHIFTS = ['7AM-1PM', '1PM-7PM', '7AM-7PM', '7PM-7AM'];

// @POST /api/roster
const createRoster = async (req, res) => {
  const { nurse, ward, date, shift, month } = req.body;

  // --- Validation ---
  if (!nurse || !ward || !date || !shift || !month) {
    return res.status(400).json({ message: 'Please provide nurse, ward, date, shift, and month' });
  }
  if (!mongoose.Types.ObjectId.isValid(nurse)) {
    return res.status(400).json({ message: 'Invalid nurse ID' });
  }
  if (!VALID_SHIFTS.includes(shift)) {
    return res.status(400).json({ message: `Shift must be one of: ${VALID_SHIFTS.join(', ')}` });
  }
  // ------------------

  try {
    const entry = await Roster.create({ nurse, ward, date, shift, month });
    const populated = await entry.populate('nurse', 'name email');

    // Notify the assigned nurse about their new roster entry
    await Notification.create({
      recipient: nurse,
      message: `A new roster entry has been assigned to you: ${shift} on ${date} (Ward: ${ward}).`,
      type: 'roster',
    });

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/roster/my
const getMyRoster = async (req, res) => {
  try {
    const filter = { nurse: req.user._id };
    if (req.query.month) filter.month = req.query.month;

    const roster = await Roster.find(filter)
      .populate('nurse', 'name email')
      .sort({ date: 1 });
    res.json(roster);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/roster/ward/:ward
const getWardRoster = async (req, res) => {
  if (!req.params.ward) {
    return res.status(400).json({ message: 'Please provide a ward name' });
  }

  try {
    const filter = { ward: req.params.ward };
    if (req.query.month) filter.month = req.query.month;

    const roster = await Roster.find(filter)
      .populate('nurse', 'name email')
      .sort({ date: 1 });
    res.json(roster);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/roster/:id
const deleteRoster = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid roster entry ID' });
  }

  try {
    const entry = await Roster.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Roster entry not found' });
    }

    // Notify nurse before deleting
    await Notification.create({
      recipient: entry.nurse,
      message: `Your roster entry for ${entry.shift} on ${entry.date} (Ward: ${entry.ward}) has been removed.`,
      type: 'roster',
    });

    await entry.deleteOne();
    res.json({ message: 'Roster entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/roster/my/summary
// Returns dashboard stats for the logged-in nurse
const getDashboardSummary = async (req, res) => {
  try {
    const nurseId = req.user._id;

    // Current month in "YYYY-MM" format
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // All shifts this month
    const monthlyShifts = await Roster.find({ nurse: nurseId, month: currentMonth });

    // Night shifts this month (7PM–7AM)
    const nightShifts = monthlyShifts.filter(s => s.shift === '7PM-7AM');

    // Upcoming shifts: today or later (next 7 days)
    const todayStr = now.toISOString().split('T')[0]; // "YYYY-MM-DD"
    const in7Days = new Date(now);
    in7Days.setDate(in7Days.getDate() + 7);
    const in7DaysStr = in7Days.toISOString().split('T')[0];

    const upcomingShifts = monthlyShifts.filter(s => s.date >= todayStr && s.date <= in7DaysStr);

    // Leave stats (all time)
    const Leave = require('../models/Leave');
    const approvedLeaves = await Leave.find({ nurse: nurseId, status: 'approved' });
    const pendingLeaves = await Leave.find({ nurse: nurseId, status: 'pending' });

    // Overtime stats
    let overtimeTotal = 0;
    try {
      const Overtime = require('../models/Overtime');
      const overtimeRecords = await Overtime.find({ nurse: nurseId });
      overtimeTotal = overtimeRecords.reduce((sum, o) => sum + o.extraHours, 0);
    } catch (_) {
      // Overtime model may not exist yet
    }

    res.json({
      currentMonth,
      totalShiftsThisMonth: monthlyShifts.length,
      nightShiftsThisMonth: nightShifts.length,
      upcomingShiftsNext7Days: upcomingShifts.length,
      upcomingShiftDetails: upcomingShifts,
      approvedLeaveCount: approvedLeaves.length,
      pendingLeaveCount: pendingLeaves.length,
      totalOvertimeHours: overtimeTotal,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createRoster, getMyRoster, getWardRoster, deleteRoster, getDashboardSummary };