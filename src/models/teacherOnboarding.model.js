const mongoose = require('mongoose');

const teacherOnboardingSchema = new mongoose.Schema(
    {
        // ── Step 1: Personal Information ──────────────────────────────────────
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
        },
        alias: {
            type: String,
            trim: true,
        },
        gender: {
            type: String,
            enum: ['Female', 'Male', 'Prefer not to say'],
            required: [true, 'Gender is required'],
        },
        dob: {
            type: Date,
            required: [true, 'Date of birth is required'],
        },
        mobile: {
            type: String,
            required: [true, 'Mobile number is required'],
            trim: true,
        },
        whatsapp: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            trim: true,
        },
        address: {
            type: String,
            required: [true, 'Address is required'],
            trim: true,
        },
        city: {
            type: String,
            required: [true, 'City is required'],
            trim: true,
        },
        pin: {
            type: String,
            required: [true, 'PIN code is required'],
            trim: true,
        },

        // ── Step 2: Qualification & Teaching ─────────────────────────────────
        qualification: {
            type: String,
            required: [true, 'Qualification is required'],
            trim: true,
        },
        stream: {
            type: String,
            trim: true,
        },
        university: {
            type: String,
            required: [true, 'University / College is required'],
            trim: true,
        },
        passYear: {
            type: Number,
        },
        experience: {
            type: String,
            required: [true, 'Teaching experience is required'],
        },
        mode: {
            type: String,
            required: [true, 'Mode of teaching is required'],
        },
        subjects: {
            type: [String],
            default: [],
        },
        boards: {
            type: String,
            trim: true,
        },
        rate: {
            type: Number,
            required: [true, 'Expected rate is required'],
            min: [0, 'Rate cannot be negative'],
        },
        prevInstitutions: {
            type: String,
            trim: true,
        },
        bio: {
            type: String,
            trim: true,
        },

        // ── Step 3: Bank & Payment Details ───────────────────────────────────
        accName: {
            type: String,
            required: [true, 'Account holder name is required'],
            trim: true,
        },
        accNumber: {
            type: String,
            required: [true, 'Account number is required'],
            trim: true,
        },
        ifsc: {
            type: String,
            required: [true, 'IFSC code is required'],
            trim: true,
            uppercase: true,
        },
        bankName: {
            type: String,
            required: [true, 'Bank name is required'],
            trim: true,
        },
        branch: {
            type: String,
            trim: true,
        },
        accType: {
            type: String,
            enum: ['Savings Account', 'Current Account'],
            required: [true, 'Account type is required'],
        },
        upiId: {
            type: String,
            trim: true,
        },
        payMethod: {
            type: String,
            required: [true, 'Preferred payment method is required'],
        },
        payCycle: {
            type: String,
            enum: ['Weekly', 'Bi-weekly', 'Monthly', ''],
        },

        // ── Step 4: Documents & Declaration ──────────────────────────────────
        aadhaar: {
            type: String,
            required: [true, 'Aadhaar number is required'],
            trim: true,
        },
        pan: {
            type: String,
            trim: true,
            uppercase: true,
        },
        emergName: {
            type: String,
            required: [true, 'Emergency contact name is required'],
            trim: true,
        },
        emergPhone: {
            type: String,
            required: [true, 'Emergency contact number is required'],
            trim: true,
        },
        emergRelation: {
            type: String,
            trim: true,
        },
        notes: {
            type: String,
            trim: true,
        },

        // ── Meta ──────────────────────────────────────────────────────────────
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'approved', 'rejected'],
            default: 'pending',
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        reviewedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for admin list queries
teacherOnboardingSchema.index({ status: 1, createdAt: -1 });
teacherOnboardingSchema.index({ email: 1 });
teacherOnboardingSchema.index({ fullName: 'text', email: 'text', city: 'text' });

const TeacherOnboarding = mongoose.model('TeacherOnboarding', teacherOnboardingSchema);
module.exports = TeacherOnboarding;
