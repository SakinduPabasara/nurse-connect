const mongoose = require('mongoose');

let cachedConn = null;

const connectDB = async () => {
  if (cachedConn && mongoose.connection.readyState === 1) {
    return cachedConn;
  }

  if (!process.env.MONGO_URI) {
    console.error('CRITICAL: MONGO_URI is not set in environment variables!');
    throw new Error('MONGO_URI is missing');
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    cachedConn = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;
