const Roster = require('../models/Roster');

// @POST /api/roster  — Create roster entry (Admin)
const createRoster = async (req, res) => {
  const { nurse, ward, date, shift, month } = req.body;
  try {
    const entry = await Roster.create({ nurse, ward, date, shift, month });
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/roster/my  — Get logged-in nurse's roster
const getMyRoster = async (req, res) => {
  try {
    const roster = await Roster.find({ nurse: req.user._id }).sort({ date: 1 });
    res.json(roster);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/roster/ward/:ward  — Get all nurses in a ward
const getWardRoster = async (req, res) => {
  try {
    const roster = await Roster.find({ ward: req.params.ward })
      .populate('nurse', 'name email')
      .sort({ date: 1 });
    res.json(roster);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/roster/:id  — Delete roster entry (Admin)
const deleteRoster = async (req, res) => {
  try {
    const entry = await Roster.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Roster entry not found' });
    res.json({ message: 'Roster entry deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createRoster, getMyRoster, getWardRoster, deleteRoster };