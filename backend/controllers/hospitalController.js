const Hospital = require("../models/Hospital");

// @GET /api/hospitals
// @desc Get all hospitals (Public - for registration)
const getHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find({ isActive: true }).sort({ name: 1 });
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/hospitals
// @desc Create a new hospital (Admin only)
const createHospital = async (req, res) => {
  const { name, location, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Hospital name is required" });
  }

  try {
    const exists = await Hospital.findOne({ name: name.trim() });
    if (exists) {
      return res.status(400).json({ message: "Hospital already exists" });
    }

    const hospital = await Hospital.create({
      name: name.trim(),
      location: location?.trim() || "",
      description: description?.trim() || "",
      createdBy: req.user?._id,
    });

    res.status(201).json(hospital);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PUT /api/hospitals/:id
// @desc Update a hospital (Admin only)
const updateHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    hospital.name = req.body.name?.trim() || hospital.name;
    hospital.location = req.body.location?.trim() || hospital.location;
    hospital.description = req.body.description?.trim() || hospital.description;
    if (req.body.isActive !== undefined) {
      hospital.isActive = req.body.isActive;
    }

    const updated = await hospital.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/hospitals/:id
// @desc Delete a hospital (Admin only)
const deleteHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    await hospital.deleteOne();
    res.json({ message: "Hospital removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getHospitals,
  createHospital,
  updateHospital,
  deleteHospital,
};
