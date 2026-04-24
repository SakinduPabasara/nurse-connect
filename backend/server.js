const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const http = require("http");
const connectDB = require("./config/db");
const socketManager = require("./utils/socketManager");
const dns = require("node:dns"); // Changed from import to require
dns.setServers(["1.1.1.1", "8.8.8.8"]); // This helps resolve the MongoDB SRV record

// Load env variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // allows reading JSON from requests
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

// Test route
app.get("/", (req, res) => {
  res.send("NurseConnect API is running...");
});

const server = http.createServer(app);
socketManager.init(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
