const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// ✅ Use the REAL User model (includes the pre-save hash hook)
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
    // Remove existing admin with same email
    await User.deleteOne({ email: 'admin@nurseconnect.com' });

    // ✅ Just create with plain password — the model's pre-save hook hashes it automatically
    await User.create({
      name: 'Super Admin',
      email: 'admin@nurseconnect.com',
      password: 'Admin@1234',
      role: 'admin',
      ward: 'Admin',
      hospital: 'General Hospital',
    });

    console.log('');
    console.log('✅ Admin created successfully!');
    console.log('-----------------------------------');
    console.log('   Email   : admin@nurseconnect.com');
    console.log('   Password: Admin@1234');
    console.log('-----------------------------------');
    console.log('Run: npm run dev  to start the server');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder error:', error.message);
    process.exit(1);
  }
};

seedAdmin();