const User = require('../models/user.model');
const Student = require('../models/student.model');
const Class = require('../models/class.model');
const { sendSuccess } = require('../utils/response.util');
const { getPagination, buildPaginationMeta } = require('../utils/pagination.util');
const { buildFilter } = require('../utils/filter.util');
const asyncHandler = require('../utils/asyncHandler.util');

/**
 * @route   GET /api/admin/teachers
 * @desc    Get all teachers with optional search/filter
 * @access  Private [admin, super_admin]
 */
const getAllTeachers = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { role: 'teacher' };

    if (req.query.search) {
        const regex = new RegExp(req.query.search, 'i');
        filter.$or = [{ name: regex }, { email: regex }, { city: regex }, { subjects: regex }];
    }

    const [teachers, total] = await Promise.all([
        User.find(filter).select('-password').skip(skip).limit(limit).sort({ createdAt: -1 }),
        User.countDocuments(filter),
    ]);

    return sendSuccess(res, {
        teachers,
        pagination: buildPaginationMeta(total, page, limit),
    });
});

/**
 * @route   GET /api/admin/students
 * @desc    Get all students across all teachers with filters
 * @access  Private [admin, super_admin]
 */
const getAllStudents = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = buildFilter(req.query, 'createdAt');

    if (req.query.search) {
        filter.name = new RegExp(req.query.search, 'i');
    }

    const [students, total] = await Promise.all([
        Student.find(filter)
            .populate('teacherId', 'name email city googleMeetLink')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),
        Student.countDocuments(filter),
    ]);

    return sendSuccess(res, {
        students,
        pagination: buildPaginationMeta(total, page, limit),
    });
});

/**
 * @route   GET /api/admin/classes
 * @desc    Get all classes across all teachers with filters
 * @access  Private [admin, super_admin]
 */
const getAllClasses = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = buildFilter(req.query, 'date');

    const [classes, total] = await Promise.all([
        Class.find(filter)
            .populate('teacherId', 'name email googleMeetLink')
            .populate('studentId', 'name class')
            .skip(skip)
            .limit(limit)
            .sort({ date: -1 }),
        Class.countDocuments(filter),
    ]);

    return sendSuccess(res, {
        classes,
        pagination: buildPaginationMeta(total, page, limit),
    });
});

/**
 * @route   GET /api/admin/stats
 * @desc    Get aggregated dashboard statistics in a single call
 * @access  Private [admin, super_admin]
 */
const getDashboardStats = asyncHandler(async (req, res) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
        totalTeachers,
        totalStudents,
        classesThisMonth,
        classesLastMonth,
        revenueResult,
        upcomingClasses,
        recentClasses,
        teacherPerformance,
    ] = await Promise.all([
        User.countDocuments({ role: 'teacher' }),
        Student.countDocuments({}),
        Class.countDocuments({ date: { $gte: startOfMonth } }),
        Class.countDocuments({ date: { $gte: startOfLastMonth, $lt: startOfMonth } }),
        Class.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Class.countDocuments({ status: { $in: ['scheduled', 'ongoing'] } }),
        Class.find({ status: { $in: ['completed', 'ongoing'] } })
            .sort({ date: -1 })
            .limit(5)
            .populate('studentId', 'name')
            .populate('teacherId', 'name email'),
        // Top 5 teachers by revenue
        Class.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: '$teacherId', totalRevenue: { $sum: '$amount' }, classCount: { $sum: 1 } } },
            { $sort: { totalRevenue: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'teacher' } },
            { $unwind: '$teacher' },
            { $project: { 'teacher.name': 1, 'teacher.email': 1, totalRevenue: 1, classCount: 1 } },
        ]),
    ]);

    return sendSuccess(res, {
        totalTeachers,
        totalStudents,
        classesThisMonth,
        classesLastMonth,
        totalRevenue: revenueResult[0]?.total || 0,
        upcomingClasses,
        recentClasses,
        topTeachers: teacherPerformance,
    });
});

module.exports = { getAllTeachers, getAllStudents, getAllClasses, getDashboardStats };
