const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
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
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0, 'Amount cannot be negative'],
        },
        paymentDate: {
            type: Date,
            required: [true, 'Payment date is required'],
            default: Date.now,
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'overdue', 'partial'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    }
);

paymentSchema.index({ teacherId: 1 });
paymentSchema.index({ teacherId: 1, studentId: 1 });
paymentSchema.index({ teacherId: 1, status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
