/**
 * Seed Script — Teacher Management System
 * Seeds: 3 users (super_admin, admin, teacher), 5 students, 8 class sessions,
 *        4 progress reports, 5 payments
 *
 * Run with: node src/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/teachers_record';

// ── Models ─────────────────────────────────────────────────────────────────
const User = require('./models/user.model');
const Student = require('./models/student.model');
const Class = require('./models/class.model');
const Report = require('./models/report.model');
const Payment = require('./models/payment.model');

async function seed() {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected!');

    // ── Clear existing data ───────────────────────────────────────────────
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
        User.deleteMany({}),
        Student.deleteMany({}),
        Class.deleteMany({}),
        Report.deleteMany({}),
        Payment.deleteMany({}),
    ]);

    // ── Hash passwords ───────────────────────────────────────────────────
    const adminPass = await bcrypt.hash('admin123', 10);
    const teacherPass = await bcrypt.hash('teacher123', 10);

    // ── Create Users ─────────────────────────────────────────────────────
    console.log('👤 Creating users...');
    const [superAdmin, admin, teacher] = await User.insertMany([
        {
            name: 'Super Admin',
            email: 'superadmin@school.com',
            password: adminPass,
            role: 'super_admin',
            phone: '+91 98765 00001',
            city: 'Mumbai',
            subjects: [],
            qualification: 'M.Tech',
            experience: 10,
            bio: 'System administrator with full access.',
        },
        {
            name: 'Admin User',
            email: 'admin@school.com',
            password: adminPass,
            role: 'admin',
            phone: '+91 98765 00002',
            city: 'Delhi',
            subjects: [],
            qualification: 'MBA',
            experience: 7,
            bio: 'School administrator managing teachers and students.',
        },
        {
            name: 'Priya Sharma',
            email: 'teacher@school.com',
            password: teacherPass,
            role: 'teacher',
            phone: '+91 98765 00003',
            city: 'Pune',
            subjects: ['Mathematics', 'Physics'],
            qualification: 'M.Sc. Mathematics',
            experience: 5,
            bio: 'Experienced math and physics tutor with 5 years of teaching.',
        },
    ]);
    console.log(`   ✓ Super Admin: superadmin@school.com / admin123`);
    console.log(`   ✓ Admin:       admin@school.com / admin123`);
    console.log(`   ✓ Teacher:     teacher@school.com / teacher123`);

    // ── Create Students ───────────────────────────────────────────────────
    console.log('🎓 Creating students...');
    const [s1, s2, s3, s4, s5] = await Student.insertMany([
        {
            name: 'Arjun Mehta',
            class: 'Grade 10',
            school: 'Delhi Public School',
            parentName: 'Rakesh Mehta',
            parentPhone: '+91 98100 11111',
            email: 'arjun@example.com',
            subject: 'Mathematics',
            teacherId: teacher._id,
            startDate: new Date('2024-06-01'),
            status: 'active',
            notes: 'Strong in algebra, needs help with geometry.',
        },
        {
            name: 'Sneha Patel',
            class: 'Grade 9',
            school: "St. Xavier's School",
            parentName: 'Hemant Patel',
            parentPhone: '+91 98100 22222',
            email: 'sneha@example.com',
            subject: 'Physics',
            teacherId: teacher._id,
            startDate: new Date('2024-07-15'),
            status: 'active',
            notes: 'Good student, very attentive.',
        },
        {
            name: 'Ravi Kumar',
            class: 'Grade 11',
            school: 'Kendriya Vidyalaya',
            parentName: 'Suresh Kumar',
            parentPhone: '+91 98100 33333',
            email: 'ravi@example.com',
            subject: 'Mathematics',
            teacherId: teacher._id,
            startDate: new Date('2024-08-01'),
            status: 'active',
            notes: 'Preparing for JEE.',
        },
        {
            name: 'Ananya Singh',
            class: 'Grade 8',
            school: 'Modern School',
            parentName: 'Amit Singh',
            parentPhone: '+91 98100 44444',
            email: 'ananya@example.com',
            subject: 'Mathematics',
            teacherId: teacher._id,
            startDate: new Date('2024-05-10'),
            status: 'active',
            notes: 'Needs extra attention on fractions.',
        },
        {
            name: 'Rahul Joshi',
            class: 'Grade 12',
            school: 'Ryan International',
            parentName: 'Vijay Joshi',
            parentPhone: '+91 98100 55555',
            email: 'rahul@example.com',
            subject: 'Physics',
            teacherId: teacher._id,
            startDate: new Date('2024-04-01'),
            status: 'inactive',
            notes: 'On break until next semester.',
        },
    ]);
    console.log(`   ✓ Created 5 students for teacher Priya Sharma`);

    // ── Create Classes ─────────────────────────────────────────────────────
    console.log('📚 Creating class sessions...');
    const today = new Date();
    const daysAgo = (n) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - n);

    const [c1, c2, c3, c4, c5, c6, c7, c8] = await Class.insertMany([
        { teacherId: teacher._id, studentId: s1._id, subject: 'Mathematics', topic: 'Quadratic Equations', date: daysAgo(14), time: '10:00', duration: 60, amount: 600, status: 'completed' },
        { teacherId: teacher._id, studentId: s1._id, subject: 'Mathematics', topic: 'Trigonometry Basics', date: daysAgo(7), time: '10:00', duration: 60, amount: 600, status: 'completed' },
        { teacherId: teacher._id, studentId: s2._id, subject: 'Physics', topic: 'Laws of Motion', date: daysAgo(10), time: '11:00', duration: 90, amount: 800, status: 'completed' },
        { teacherId: teacher._id, studentId: s2._id, subject: 'Physics', topic: 'Work & Energy', date: daysAgo(3), time: '11:00', duration: 90, amount: 800, status: 'completed' },
        { teacherId: teacher._id, studentId: s3._id, subject: 'Mathematics', topic: 'Integration', date: daysAgo(5), time: '14:00', duration: 90, amount: 700, status: 'completed' },
        { teacherId: teacher._id, studentId: s4._id, subject: 'Mathematics', topic: 'Fractions', date: daysAgo(2), time: '16:00', duration: 60, amount: 500, status: 'completed' },
        { teacherId: teacher._id, studentId: s1._id, subject: 'Mathematics', topic: 'Circle Theorems', date: daysAgo(-3), time: '10:00', duration: 60, amount: 600, status: 'scheduled' },
        { teacherId: teacher._id, studentId: s2._id, subject: 'Physics', topic: 'Waves & Sound', date: daysAgo(-5), time: '11:00', duration: 90, amount: 800, status: 'scheduled' },
    ]);
    console.log(`   ✓ Created 8 class sessions (6 completed, 2 upcoming)`);

    // ── Create Progress Reports ────────────────────────────────────────────
    console.log('📊 Creating progress reports...');
    await Report.insertMany([
        {
            teacherId: teacher._id,
            studentId: s1._id,
            subject: 'Mathematics',
            date: daysAgo(7),
            topicCovered: 'Quadratic Equations & Trigonometry',
            homeworkGiven: 'Exercise 8.1 Q1-15 and Ex 9.2 Q1-10',
            understandingLevel: 4,
            remarks: 'Arjun shows great improvement in algebra. Trigonometry needs more practice.',
        },
        {
            teacherId: teacher._id,
            studentId: s2._id,
            subject: 'Physics',
            date: daysAgo(3),
            topicCovered: 'Laws of Motion and Work-Energy Theorem',
            homeworkGiven: 'Problems 5.1 to 5.20 from NCERT',
            understandingLevel: 5,
            remarks: 'Sneha has excellent understanding of concepts. Ready for next chapter.',
        },
        {
            teacherId: teacher._id,
            studentId: s3._id,
            subject: 'Mathematics',
            date: daysAgo(5),
            topicCovered: 'Integration by Substitution',
            homeworkGiven: 'Solve 20 problems from R.D. Sharma Chapter 19',
            understandingLevel: 3,
            remarks: 'Ravi needs more practice on integration. Conceptuals are clear.',
        },
        {
            teacherId: teacher._id,
            studentId: s4._id,
            subject: 'Mathematics',
            date: daysAgo(2),
            topicCovered: 'Fractions and Decimals',
            homeworkGiven: 'Worksheet on mixed fractions - 15 questions',
            understandingLevel: 3,
            remarks: 'Ananya is improving. Regular practice is key.',
        },
    ]);
    console.log(`   ✓ Created 4 progress reports`);

    // ── Create Payments ───────────────────────────────────────────────────
    console.log('💰 Creating payments...');
    await Payment.insertMany([
        { teacherId: teacher._id, studentId: s1._id, amount: 1200, paymentDate: daysAgo(7), status: 'paid' },
        { teacherId: teacher._id, studentId: s2._id, amount: 1600, paymentDate: daysAgo(3), status: 'paid' },
        { teacherId: teacher._id, studentId: s3._id, amount: 700, paymentDate: daysAgo(5), status: 'paid' },
        { teacherId: teacher._id, studentId: s4._id, amount: 500, paymentDate: daysAgo(2), status: 'pending' },
        { teacherId: teacher._id, studentId: s5._id, amount: 800, paymentDate: daysAgo(30), status: 'overdue' },
    ]);
    console.log(`   ✓ Created 5 payments (3 paid, 1 pending, 1 overdue)`);

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Demo Login Credentials:');
    console.log('  Super Admin → superadmin@school.com / admin123');
    console.log('  Admin       → admin@school.com / admin123');
    console.log('  Teacher     → teacher@school.com / teacher123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});
