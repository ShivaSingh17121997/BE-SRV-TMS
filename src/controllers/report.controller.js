const Report = require('../models/report.model');
const Student = require('../models/student.model');
const { sendSuccess, sendError } = require('../utils/response.util');
const { getPagination, buildPaginationMeta } = require('../utils/pagination.util');
const { buildFilter } = require('../utils/filter.util');
const asyncHandler = require('../utils/asyncHandler.util');

const getScopeFilter = async (user, query) => {
    const filter = buildFilter(query, 'date');
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
 * @route   POST /api/reports
 * @access  Private
 */
const createReport = asyncHandler(async (req, res) => {
    const { studentId, subject, topicCovered, homework, understandingLevel, remarks, date } = req.body;

    const teacherId = req.user.role === 'teacher' ? req.user._id : req.body.teacherId;
    if (!teacherId) {
        return sendError(res, 'teacherId is required.', 400);
    }

    const report = await Report.create({
        teacherId, studentId, subject, topicCovered, homework, understandingLevel, remarks, date,
    });

    return sendSuccess(res, { report }, 'Progress report created successfully', 201);
});

/**
 * @route   GET /api/reports
 * @access  Private
 */
const getAllReports = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = await getScopeFilter(req.user, req.query);

    const [reports, total] = await Promise.all([
        Report.find(filter)
            .populate('teacherId', 'name email googleMeetLink')
            .populate('studentId', 'name class')
            .skip(skip)
            .limit(limit)
            .sort({ date: -1 }),
        Report.countDocuments(filter),
    ]);

    return sendSuccess(res, {
        reports,
        pagination: buildPaginationMeta(total, page, limit),
    });
});

/**
 * @route   GET /api/reports/:id
 * @access  Private
 */
const getReportById = asyncHandler(async (req, res) => {
    const filter = await getScopeFilter(req.user, { _id: req.params.id });

    const report = await Report.findOne(filter)
        .populate('teacherId', 'name email googleMeetLink')
        .populate('studentId', 'name class');

    if (!report) {
        return sendError(res, 'Report not found or access denied.', 404);
    }

    return sendSuccess(res, { report });
});

/**
 * @route   PATCH /api/reports/:id
 * @access  Private (Teacher only)
 */
const updateReport = asyncHandler(async (req, res) => {
    const filter = { _id: req.params.id };
    if (req.user.role === 'teacher') filter.teacherId = req.user._id;

    const report = await Report.findOneAndUpdate(
        filter,
        { $set: req.body },
        { new: true, runValidators: true }
    ).populate('teacherId', 'name email googleMeetLink').populate('studentId', 'name class');

    if (!report) {
        return sendError(res, 'Report not found or access denied.', 404);
    }

    return sendSuccess(res, { report }, 'Report updated successfully');
});

/**
 * @route   DELETE /api/reports/:id
 * @access  Private (Teacher only)
 */
const deleteReport = asyncHandler(async (req, res) => {
    const filter = { _id: req.params.id };
    if (req.user.role === 'teacher') filter.teacherId = req.user._id;

    const report = await Report.findOneAndDelete(filter);

    if (!report) {
        return sendError(res, 'Report not found or access denied.', 404);
    }

    return sendSuccess(res, null, 'Report deleted successfully');
});

module.exports = { createReport, getAllReports, getReportById, updateReport, deleteReport };
