const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('node:dns');

dotenv.config();

dns.setServers(['1.1.1.1', '8.8.8.8']); // Fix MongoDB SRV DNS resolution

const User = require('./models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding...');
  } catch (err) {
    console.error('Connection error:', err.message);
    process.exit(1);
  }
};

const seedAdmin = async () => {
  await connectDB();

  try {
    // Remove existing admin with same NIC
    await User.deleteOne({ nic: 'ADMIN000000' });

    await User.create({
      name: 'Super Admin',
      nic: 'ADMIN000000',
      address: 'Admin Office, General Hospital',
      telephone: '0112345678',
      hospital: 'General Hospital',
      password: 'Admin@1234',
      role: 'admin',
      isVerified: true,  // Admin is always verified
    });

    console.log('');
    console.log('✅ Admin created successfully!');
    console.log('-----------------------------------');
    console.log('   NIC      : ADMIN000000');
    console.log('   Password : Admin@1234');
    console.log('-----------------------------------');
    console.log('Run: npm run dev  to start the server');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder error:', error.message);
    process.exit(1);
  }
};

seedAdmin();