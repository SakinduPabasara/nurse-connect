const Roster = require("../models/Roster");
const Notification = require("../models/Notification");
const User = require("../models/User");
const Drug = require("../models/Drug");
const Equipment = require("../models/Equipment");
const mongoose = require("mongoose");
const { getIO } = require("../utils/socketManager");
const VALID_SHIFTS = ["7AM-1PM", "1PM-7PM", "7AM-7PM", "7PM-7AM"];

const isValidISODate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date);

// @POST /api/roster
const createRoster = async (req, res) => {
  const { nurse, ward, date, shift, month } = req.body;

  // --- Validation ---
  if (!nurse || !ward || !date || !shift || !month) {
    return res
      .status(400)
      .json({ message: "Please provide nurse, ward, date, shift, and month" });
  }
  if (!mongoose.Types.ObjectId.isValid(nurse)) {
    return res.status(400).json({ message: "Invalid nurse ID" });
  }
  if (!VALID_SHIFTS.includes(shift)) {
    return res
      .status(400)
      .json({ message: `Shift must be one of: ${VALID_SHIFTS.join(", ")}` });
  }
  // ------------------

  try {
    const nurseUser = await User.findById(nurse).select("name hospital");
    if (!nurseUser) {
      return res.status(404).json({ message: "Nurse not found" });
    }

    const entry = await Roster.create({
      nurse,
      nurseName: nurseUser.name,
      hospital: nurseUser.hospital,
      ward,
      date,
      shift,
      month,
    });
    const populated = await entry.populate("nurse", "name email");

    // Notify the assigned nurse about their new roster entry
    const notif = await Notification.create({
      recipient: nurse,
      message: `A new roster entry has been assigned to you: ${shift} on ${date} (Ward: ${ward}).`,
      type: "roster",
    });

    try {
      getIO().to("user:" + nurse.toString()).emit("notification:new", notif);
      getIO().to("user:" + nurse.toString()).emit("roster:updated");
    } catch (err) {
      console.error("Socket emit error:", err.message);
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/roster/bulk
const createRosterBulk = async (req, res) => {
  const { nurse, ward, shift, month, dates } = req.body;

  if (!nurse || !ward || !shift || !month || !Array.isArray(dates)) {
    return res.status(400).json({
      message: "Please provide nurse, ward, shift, month, and dates[]",
    });
  }
  if (!mongoose.Types.ObjectId.isValid(nurse)) {
    return res.status(400).json({ message: "Invalid nurse ID" });
  }
  if (!VALID_SHIFTS.includes(shift)) {
    return res
      .status(400)
      .json({ message: `Shift must be one of: ${VALID_SHIFTS.join(", ")}` });
  }
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ message: "Month must be in YYYY-MM format" });
  }

  const cleanedDates = [
    ...new Set(dates.map((d) => String(d || "").trim()).filter(Boolean)),
  ];
  if (cleanedDates.length === 0) {
    return res
      .status(400)
      .json({ message: "Please provide at least one valid date" });
  }

  if (
    !cleanedDates.every((d) => isValidISODate(d) && d.startsWith(`${month}-`))
  ) {
    return res.status(400).json({
      message:
        "All dates must be in YYYY-MM-DD format and match the selected month",
    });
  }

  try {
    const nurseUser = await User.findById(nurse).select("name hospital");
    if (!nurseUser) {
      return res.status(404).json({ message: "Nurse not found" });
    }

    const existing = await Roster.find({
      nurse,
      hospital: nurseUser.hospital,
      ward,
      shift,
      month,
      date: { $in: cleanedDates },
    }).select("date");

    const existingDates = new Set(existing.map((r) => r.date));
    const toCreateDates = cleanedDates.filter((d) => !existingDates.has(d));

    if (toCreateDates.length === 0) {
      return res.status(200).json({
        createdCount: 0,
        skippedCount: cleanedDates.length,
        skippedDates: cleanedDates,
        entries: [],
        message:
          "All selected dates already exist for this nurse/ward/shift/month",
      });
    }

    const docs = toCreateDates.map((date) => ({
      nurse,
      nurseName: nurseUser.name,
      hospital: nurseUser.hospital,
      ward: ward.trim(),
      date,
      shift,
      month,
    }));
    const created = await Roster.insertMany(docs);

    const entries = await Roster.find({
      _id: { $in: created.map((c) => c._id) },
    })
      .populate("nurse", "name email")
      .sort({ date: 1 });

    const bulkNotif = await Notification.create({
      recipient: nurse,
      message: `New roster duties were assigned: ${toCreateDates.length} date(s) in ${month} (${shift}, Ward: ${ward}).`,
      type: "roster",
    });

    try {
      getIO().to("user:" + nurse.toString()).emit("notification:new", bulkNotif);
      getIO().to("user:" + nurse.toString()).emit("roster:updated");
    } catch (err) {
      console.error("Socket emit error:", err.message);
    }

    const skippedDates = cleanedDates.filter((d) => existingDates.has(d));
    res.status(201).json({
      createdCount: toCreateDates.length,
      skippedCount: skippedDates.length,
      skippedDates,
      entries,
    });
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
      .populate("nurse", "name email")
      .sort({ date: 1 });
    res.json(roster);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/roster/ward/:ward
const getWardRoster = async (req, res) => {
  if (!req.params.ward) {
    return res.status(400).json({ message: "Please provide a ward name" });
  }

  try {
    let hospitalFilter = req.user.hospital;
    if (req.user.role === "admin" && req.query.hospital) {
      hospitalFilter = req.query.hospital;
    }

    const filter = { hospital: hospitalFilter };
    if (req.params.ward !== "all") {
      filter.ward = req.params.ward;
    }
    if (req.query.month) filter.month = req.query.month;

    const rosterDocs = await Roster.find(filter)
      .populate("nurse", "name email hospital")
      .sort({ date: 1 });

    const roster = rosterDocs.filter(entry => {
      // Strict hospital scoping
      const entryHospital = entry.hospital || (entry.nurse && entry.nurse.hospital);
      return entry.nurse && entryHospital === hospitalFilter;
    });

    res.json(roster);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/roster/all
const getAllRosters = async (req, res) => {
  try {
    let hospitalFilter = req.user.hospital;

    // Allow Admins to override the hospital filter if a specific one is requested
    if (req.user.role === "admin" && req.query.hospital) {
      hospitalFilter = req.query.hospital;
    }

    const filter = { hospital: hospitalFilter };
    if (req.query.month) filter.month = req.query.month;
    if (req.query.ward) filter.ward = req.query.ward;
    if (req.query.nurse && mongoose.Types.ObjectId.isValid(req.query.nurse)) {
      filter.nurse = req.query.nurse;
    }

    const rosterDocs = await Roster.find(filter)
      .populate("nurse", "name email hospital ward")
      .sort({ date: 1, ward: 1 });

    const roster = rosterDocs.filter(entry => {
      // Strict hospital scoping
      const entryHospital = entry.hospital || (entry.nurse && entry.nurse.hospital);
      return entry.nurse && entryHospital === hospitalFilter;
    });

    res.json(roster);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/roster/wards
const getWardNames = async (req, res) => {
  try {
    let hospitalFilter = req.user.hospital;
    if (req.user.role === "admin" && req.query.hospital) {
      hospitalFilter = req.query.hospital;
    }

    const [rosterWards, userWards, drugWards, equipmentWards] =
      await Promise.all([
        Roster.distinct("ward", { hospital: hospitalFilter, ward: { $exists: true, $ne: null } }),
        User.distinct("ward", { hospital: hospitalFilter, ward: { $exists: true, $ne: null } }),
        Drug.distinct("ward", { hospital: hospitalFilter, ward: { $exists: true, $ne: null } }),
        Equipment.distinct("ward", { hospital: hospitalFilter, ward: { $exists: true, $ne: null } }),
      ]);

    const wards = [
      ...new Set(
        [...rosterWards, ...userWards, ...drugWards, ...equipmentWards]
          .map((name) => String(name).trim())
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b));

    res.json(wards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/roster/:id
const deleteRoster = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid roster entry ID" });
  }

  try {
    const entry = await Roster.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: "Roster entry not found" });
    }

    // Notify nurse before deleting
    const delNotif = await Notification.create({
      recipient: entry.nurse,
      message: `Your roster entry for ${entry.shift} on ${entry.date} (Ward: ${entry.ward}) has been removed.`,
      type: "roster",
    });

    try {
      getIO().to("user:" + entry.nurse.toString()).emit("notification:new", delNotif);
      getIO().to("user:" + entry.nurse.toString()).emit("roster:updated");
    } catch (err) {
      console.error("Socket emit error:", err.message);
    }

    await entry.deleteOne();
    res.json({ message: "Roster entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/roster/nurse/:id?month=YYYY-MM
const deleteRosterForNurseMonth = async (req, res) => {
  const { id } = req.params;
  const { month } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid nurse ID" });
  }
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ message: "Month must be in YYYY-MM format" });
  }

  try {
    const result = await Roster.deleteMany({ nurse: id, month });

    const delNotif = await Notification.create({
      recipient: id,
      message: `Your roster for ${month} has been removed by admin.`,
      type: "roster",
    });

    try {
      getIO().to("user:" + id.toString()).emit("notification:new", delNotif);
      getIO().to("user:" + id.toString()).emit("roster:updated");
      getIO().to("admin").emit("roster:updated");
    } catch (err) {
      console.error("Socket emit error:", err.message);
    }

    res.json({ message: "Monthly roster removed", deletedCount: result.deletedCount });
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
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // All shifts this month
    const monthlyShifts = await Roster.find({
      nurse: nurseId,
      month: currentMonth,
    });

    // Night shifts this month (7PM–7AM)
    const nightShifts = monthlyShifts.filter((s) => s.shift === "7PM-7AM");

    // Upcoming shifts: today or later (next 7 days)
    const todayStr = now.toISOString().split("T")[0]; // "YYYY-MM-DD"
    const in7Days = new Date(now);
    in7Days.setDate(in7Days.getDate() + 7);
    const in7DaysStr = in7Days.toISOString().split("T")[0];

    const upcomingShifts = monthlyShifts.filter(
      (s) => s.date >= todayStr && s.date <= in7DaysStr,
    );

    // Leave stats (all time)
    const Leave = require("../models/Leave");
    const approvedLeaves = await Leave.find({
      nurse: nurseId,
      status: "approved",
    });
    const pendingLeaves = await Leave.find({
      nurse: nurseId,
      status: "pending",
    });

    // Overtime stats
    let overtimeTotal = 0;
    try {
      const Overtime = require("../models/Overtime");
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

// @GET /api/roster/nurse/:id  — fetch any nurse's upcoming roster (for swap form)
const getNurseRoster = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid nurse ID' });
  }
  try {
    const today = new Date().toISOString().split('T')[0];
    const roster = await Roster.find({
      nurse: id,
      date: { $gte: today },
    }).sort({ date: 1 });
    res.json(roster);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRoster,
  createRosterBulk,
  getMyRoster,
  getAllRosters,
  getWardRoster,
  getWardNames,
  deleteRoster,
  deleteRosterForNurseMonth,
  getDashboardSummary,
  getNurseRoster,
};
