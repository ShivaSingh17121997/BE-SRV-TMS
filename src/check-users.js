const mongoose = require('mongoose');
const User = require('./models/user.model');
const { MONGO_URI } = require('./config/env');

async function checkAndReset() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected!');

        const users = await User.find({}, 'name email role');
        console.log('\n👥 Existing Users in Database:');
        console.log(users);

        const superAdminEmail = 'superadmin@school.com';
        let admin = await User.findOne({ email: superAdminEmail });

        if (!admin) {
            console.log(`\nCreating new superadmin as it was not found...`);
            admin = new User({
                name: 'Super Admin',
                email: superAdminEmail,
                password: '123456',
                role: 'super_admin'
            });
        } else {
            console.log(`\nFound existing superadmin. Resetting password to "123456"...`);
            admin.password = '123456';
        }

        await admin.save();
        console.log(`🎉 Password reset/user created successfully!`);
        console.log(`Email: ${superAdminEmail}`);
        console.log(`Password: 123456`);

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected.');
    }
}

checkAndReset();
