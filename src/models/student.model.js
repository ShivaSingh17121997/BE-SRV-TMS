const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Student name is required'],
            trim: true,
        },
        class: {
            type: String,
            trim: true,
        },
        school: {
            type: String,
            trim: true,
        },
        parentName: {
            type: String,
            trim: true,
        },
        parentPhone: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            lowercase: true,
            trim: true,
        },
        subject: {
            type: String,
            trim: true,
        },
        feePerClass: {
            type: Number,
            default: 0,
        },
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Teacher ID is required'],
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        startDate: {
            type: Date,
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'on_hold'],
            default: 'active',
        },
        notes: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster teacher-scoped queries
studentSchema.index({ teacherId: 1 });
studentSchema.index({ teacherId: 1, status: 1 });

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;
