const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for admin seeding...');

    const adminEmail = 'admin@airline.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`Admin account already exists: ${adminEmail}`);
    } else {
      await User.create({
        firstName: 'System',
        lastName: 'Admin',
        email: adminEmail,
        password: 'admin123',
        role: 'admin',
        phone: '123-456-7890',
        nationality: 'System'
      });
      console.log(`Admin account created successfully: ${adminEmail} / admin123`);
    }

    await mongoose.disconnect();
    console.log('Database disconnected.');
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding admin: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
