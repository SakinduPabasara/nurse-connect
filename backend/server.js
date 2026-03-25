const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

const dns = require('node:dns'); // Changed from import to require
dns.setServers(['1.1.1.1', '8.8.8.8']);   // This helps resolve the MongoDB SRV record
 
// Load env variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // allows reading JSON from requests

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/roster', require('./routes/rosterRoutes'));
app.use('/api/swap', require('./routes/swapRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/notices', require('./routes/noticeBoardRoutes'));
app.use('/api/drugs', require('./routes/drugRoutes'));
app.use('/api/equipment', require('./routes/equipmentRoutes'));

// Test route
app.get('/', (req, res) => {
  res.send('NurseConnect API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});