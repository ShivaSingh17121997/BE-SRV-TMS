require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const connectDB = require('../config/db');

const seedSuperAdmin = async () => {
    await connectDB();

    const email = 'superadmin@school.com';

    const existing = await User.findOne({ email });
    if (existing) {
        console.log(`⚠️  Super Admin already exists: ${email}`);
        process.exit(0);
    }

    await User.create({
        name: 'Super Admin',
        email,
        password: '123456',
        role: 'super_admin',
    });

    console.log('✅ Super Admin seeded successfully!');
    console.log(`   Email   : ${email}`);
    console.log(`   Password: 123456`);
    console.log(`   Role    : super_admin`);
    process.exit(0);
};

seedSuperAdmin().catch((err) => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});
