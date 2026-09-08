const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const http = require("http");
const connectDB = require("./config/db");
const socketManager = require("./utils/socketManager");
try {
  const dns = require("node:dns");
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
} catch (e) {
  // Ignore in environments where custom DNS cannot be bound
}

// Load env variables
dotenv.config();

// Initial database connection and migrations
connectDB().then(async () => {
  // Simple migration to ensure all wards have a hospital
  try {
    const Ward = require("./models/Ward");
    const Hospital = require("./models/Hospital");
    const unassignedCount = await Ward.countDocuments({
      hospital: { $exists: false },
    });
    if (unassignedCount > 0) {
      const firstHosp = await Hospital.findOne({});
      if (firstHosp) {
        console.log(
          `[MIGRATION] Assigning ${unassignedCount} unassigned wards to ${firstHosp.name}`,
        );
        await Ward.updateMany(
          { hospital: { $exists: false } },
          { $set: { hospital: firstHosp.name } },
        );
      }
    }

    // Drop legacy global unique index on ward name, then ensure compound index.
    const indexes = await Ward.collection.indexes();
    const legacy = indexes.find((i) => i.name === "name_1");
    if (legacy) {
      await Ward.collection.dropIndex("name_1");
      console.log("[MIGRATION] Dropped legacy wards.name unique index");
    }
    await Ward.collection.createIndex(
      { hospital: 1, name: 1 },
      { unique: true },
    );
  } catch (err) {
    console.error("[MIGRATION_ERROR]", err);
  }
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // allows reading JSON from requests
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Ensure database is connected before processing requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: "Database connection failed. Please check MONGO_URI." });
  }
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/roster", require("./routes/rosterRoutes"));
app.use("/api/swap", require("./routes/swapRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/notices", require("./routes/noticeBoardRoutes"));
app.use("/api/drugs", require("./routes/drugRoutes"));
app.use("/api/equipment", require("./routes/equipmentRoutes"));
app.use("/api/leave", require("./routes/leaveRoutes"));
app.use("/api/transfers", require("./routes/transferRoutes"));
app.use("/api/news", require("./routes/newsRoutes"));
app.use("/api/opportunities", require("./routes/opportunityRoutes"));
app.use("/api/community", require("./routes/communityRoutes"));
app.use("/api/documents", require("./routes/documentRoutes"));
app.use("/api/overtime", require("./routes/overtimeRoutes"));
app.use("/api/wards", require("./routes/wardRoutes"));
app.use("/api/hospitals", require("./routes/hospitalRoutes"));

// Test route
app.get("/", (req, res) => {
  res.send("NurseConnect API is running...");
});

const server = http.createServer(app);
socketManager.init(server);

const PORT = process.env.PORT || 5000;
if (require.main === module && !process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
