require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createAdmin() {
  try {
    if (!process.env.MONGO_URI) {
      console.log('❌ Please set MONGO_URI in your .env file');
      process.exit(1);
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      firstName: 'Enzo',
      lastName: 'Coder',
      username: 'enzocoder',
      email: 'enzocoder87@gmail.com',
      password: 'enzocoder',
      role: 'admin',
      bio: 'Portfolio administrator and developer',
      socialLinks: {
        github: 'https://github.com/Pierre-12-enzo',
        linkedin: 'https://linkedin.com/in/enzocoder87',
        twitter: 'https://twitter.com/enzocoder87',
        website: 'https://enzo-vue-portfolio.netlify.app'
      }
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Username: admin');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password after first login');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();
