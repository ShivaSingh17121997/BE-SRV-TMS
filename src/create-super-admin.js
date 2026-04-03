const mongoose = require('mongoose');
const User = require('./models/user.model');
const { MONGO_URI } = require('./config/env');

async function createSuperAdmin() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected!');

        const email = 'superduperadmin@gmail.com';
        const password = 'superduper@123';
        const name = 'Super Duper Admin';

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log(`⚠️ User with email ${email} already exists.`);
            await mongoose.disconnect();
            process.exit(0);
        }

        // Create new super admin
        // Note: Password hashing is handled by the User model's pre-save hook
        const superAdmin = new User({
            name,
            email,
            password,
            role: 'super_admin',
            phone: '+91 00000 00000',
            city: 'System',
            bio: 'Super Super Admin with full system control.'
        });

        await superAdmin.save();
        console.log(`\n🎉 Super Admin created successfully!`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`  Email:    ${email}`);
        console.log(`  Password: ${password}`);
        console.log(`  Role:     super_admin`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    } catch (error) {
        console.error('❌ Error creating super admin:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

createSuperAdmin();
