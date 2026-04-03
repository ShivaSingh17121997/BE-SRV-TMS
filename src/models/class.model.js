const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
    {
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Teacher ID is required'],
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: [true, 'Student ID is required'],
        },
        subject: {
            type: String,
            trim: true,
            required: [true, 'Subject is required'],
        },
        topic: {
            type: String,
            trim: true,
        },
        date: {
            type: Date,
            required: [true, 'Date is required'],
        },
        time: {
            type: String,
            trim: true,
        },
        duration: {
            type: Number, // in minutes
        },
        amount: {
            type: Number,
            default: 0,
        },
        notes: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'rescheduled'],
            default: 'scheduled',
        },
        conducted: {
            type: Boolean,
            default: false,
        },
        missed: {
            type: Boolean,
            default: false,
        },
        actualStartTime: {
            type: Date,
        },
        actualEndTime: {
            type: Date,
        },
        studentJoins: [{
            studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
            joinedAt: { type: Date, default: Date.now }
        }],
        createdAt: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
    }
);

classSchema.index({ teacherId: 1 });
classSchema.index({ teacherId: 1, date: -1 });
classSchema.index({ teacherId: 1, studentId: 1 });

const Class = mongoose.model('Class', classSchema);
module.exports = Class;
