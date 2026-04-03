const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
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
        topicCovered: {
            type: String,
            trim: true,
        },
        homework: {
            type: String,
            trim: true,
        },
        understandingLevel: {
            type: Number,
            min: [1, 'Understanding level must be at least 1'],
            max: [5, 'Understanding level cannot exceed 5'],
            default: 3,
        },
        remarks: {
            type: String,
            trim: true,
        },
        date: {
            type: Date,
            required: [true, 'Date is required'],
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

reportSchema.index({ teacherId: 1 });
reportSchema.index({ teacherId: 1, studentId: 1 });
reportSchema.index({ teacherId: 1, date: -1 });

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;
