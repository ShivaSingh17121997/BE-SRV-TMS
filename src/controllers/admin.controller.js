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
        filter.$or = [{ name: regex }, { email: regex }, { city: regex }];
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

module.exports = { getAllTeachers, getAllStudents, getAllClasses };
