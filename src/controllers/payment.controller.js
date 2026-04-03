const Payment = require('../models/payment.model');
const Student = require('../models/student.model');
const { sendSuccess, sendError } = require('../utils/response.util');
const { getPagination, buildPaginationMeta } = require('../utils/pagination.util');
const { buildFilter } = require('../utils/filter.util');
const asyncHandler = require('../utils/asyncHandler.util');

const getScopeFilter = async (user, query) => {
    const filter = buildFilter(query, 'paymentDate');
    if (user.role === 'teacher') {
        filter.teacherId = user._id;
    } else if (user.role === 'student') {
        const students = await Student.find({ userId: user._id });
        if (students.length > 0) filter.studentId = { $in: students.map(s => s._id) };
        else filter.studentId = null; 
    } else if (query.teacherId) {
        filter.teacherId = query.teacherId;
    }
    return filter;
};

/**
 * @route   POST /api/payments
 * @access  Private
 */
const createPayment = asyncHandler(async (req, res) => {
    const { studentId, amount, paymentDate, status } = req.body;

    const teacherId = req.user.role === 'teacher' ? req.user._id : req.body.teacherId;
    if (!teacherId) {
        return sendError(res, 'teacherId is required.', 400);
    }

    const payment = await Payment.create({ teacherId, studentId, amount, paymentDate, status });

    return sendSuccess(res, { payment }, 'Payment recorded successfully', 201);
});

/**
 * @route   GET /api/payments
 * @access  Private
 */
const getAllPayments = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = await getScopeFilter(req.user, req.query);

    const [payments, total] = await Promise.all([
        Payment.find(filter)
            .populate('teacherId', 'name email googleMeetLink')
            .populate('studentId', 'name class')
            .skip(skip)
            .limit(limit)
            .sort({ paymentDate: -1 }),
        Payment.countDocuments(filter),
    ]);

    return sendSuccess(res, {
        payments,
        pagination: buildPaginationMeta(total, page, limit),
    });
});

/**
 * @route   GET /api/payments/:id
 * @access  Private
 */
const getPaymentById = asyncHandler(async (req, res) => {
    const filter = await getScopeFilter(req.user, { _id: req.params.id });

    const payment = await Payment.findOne(filter)
        .populate('teacherId', 'name email googleMeetLink')
        .populate('studentId', 'name class');

    if (!payment) {
        return sendError(res, 'Payment not found or access denied.', 404);
    }

    return sendSuccess(res, { payment });
});

/**
 * @route   PATCH /api/payments/:id
 * @access  Private
 */
const updatePayment = asyncHandler(async (req, res) => {
    const filter = await getScopeFilter(req.user, { _id: req.params.id });

    if (req.user.role === 'teacher') delete req.body.teacherId;

    const payment = await Payment.findOneAndUpdate(
        filter,
        { $set: req.body },
        { new: true, runValidators: true }
    );

    if (!payment) {
        return sendError(res, 'Payment not found or access denied.', 404);
    }

    return sendSuccess(res, { payment }, 'Payment updated successfully');
});

module.exports = { createPayment, getAllPayments, getPaymentById, updatePayment };
