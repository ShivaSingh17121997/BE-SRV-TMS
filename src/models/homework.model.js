const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    },
    subject: {
        type: String,
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    attachments: [{
        type: String
    }],
    submissions: [{
        type: String
    }],
    submissionNotes: {
        type: String
    },
    dueDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending', 'submitted', 'graded'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Homework', homeworkSchema);
