const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');

// The admin login comes from ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env.
// The defaults below are for local development and demos only. Set your own
// ADMIN_PASSWORD before seeding a deployed database, because this repository is public.
const DEFAULT_ADMIN_EMAIL = 'admin@airline.com';
const DEFAULT_ADMIN_PASSWORD = 'admin123';

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for admin seeding...');

    const adminEmail = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

    if (!process.env.ADMIN_PASSWORD) {
      console.warn('WARNING: ADMIN_PASSWORD is not set, using the public default password. Fine for local use, not for a deployed site.');
    }

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`Admin account already exists: ${adminEmail}`);
    } else {
      await User.create({
        firstName: 'System',
        lastName: 'Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        phone: '123-456-7890',
        nationality: 'System'
      });
      // The password is never printed
      console.log(`Admin account created successfully: ${adminEmail}`);
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
