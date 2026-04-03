const Class = require('../models/class.model');
const Student = require('../models/student.model');
const { sendSuccess, sendError } = require('../utils/response.util');
const { getPagination, buildPaginationMeta } = require('../utils/pagination.util');
const { buildFilter } = require('../utils/filter.util');
const asyncHandler = require('../utils/asyncHandler.util');

const getScopeFilter = async (user, query) => {
    // Start with a clone of query to preserve fields like _id
    const filter = { ...query };
    
    // Apply standard filters (date range, etc.)
    const standardFilters = buildFilter(query, 'date');
    Object.assign(filter, standardFilters);

    if (user.role === 'teacher') {
        filter.teacherId = user._id;
    } else if (user.role === 'student') {
        const students = await Student.find({ userId: user._id });
        if (students.length > 0) filter.studentId = { $in: students.map(s => s._id) };
        else filter.studentId = null;
    } else if (query.teacherId && require('mongoose').Types.ObjectId.isValid(query.teacherId)) {
        filter.teacherId = query.teacherId;
    }

    // Clean up transient query params that shouldn't be in the final filter
    delete filter.startDate;
    delete filter.endDate;
    delete filter.date;
    delete filter.search;
    delete filter.page;
    delete filter.limit;
    delete filter.sortBy;
    delete filter.sortOrder;

    return filter;
};

/**
 * @route   POST /api/classes
 * @access  Private [all authenticated]
 */
const createClass = asyncHandler(async (req, res) => {
    const { studentId, subject, topic, date, time, duration, amount, notes, status } = req.body;

    const teacherId = req.user.role === 'teacher' ? req.user._id : req.body.teacherId;
    if (!teacherId) {
        return sendError(res, 'teacherId is required.', 400);
    }

    // If amount is not provided, fetch it from the student's feePerClass
    let finalAmount = amount;
    if (finalAmount === undefined || finalAmount === null) {
        const student = await Student.findById(studentId);
        if (student) {
            finalAmount = student.feePerClass;
        }
    }

    const newClass = await Class.create({
        teacherId, studentId, subject, topic, date, time, duration, amount: finalAmount || 0, notes, status,
    });

    return sendSuccess(res, { class: newClass }, 'Class created successfully', 201);
});

/**
 * @route   GET /api/classes
 * @access  Private
 */
const getAllClasses = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = await getScopeFilter(req.user, req.query);

    if (req.query.search) {
        const regex = new RegExp(req.query.search, 'i');
        filter.$or = [
            { topic: regex },
            { subject: regex }
        ];
    }

    if (req.query.subject) {
        filter.subject = new RegExp(req.query.subject, 'i');
    }

    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const [classes, total] = await Promise.all([
        Class.find(filter)
            .populate('teacherId', 'name email googleMeetLink')
            .populate('studentId', 'name class')
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder }),
        Class.countDocuments(filter),
    ]);

    return sendSuccess(res, {
        classes,
        pagination: buildPaginationMeta(total, page, limit),
    });
});

/**
 * @route   GET /api/classes/:id
 * @access  Private
 */
const getClassById = asyncHandler(async (req, res) => {
    const filter = await getScopeFilter(req.user, { _id: req.params.id });

    const classItem = await Class.findOne(filter)
        .populate('teacherId', 'name email googleMeetLink')
        .populate('studentId', 'name class');

    if (!classItem) {
        return sendError(res, 'Class not found or access denied.', 404);
    }

    return sendSuccess(res, { class: classItem });
});

/**
 * @route   PATCH /api/classes/:id
 * @access  Private
 */
const updateClass = asyncHandler(async (req, res) => {
    const filter = await getScopeFilter(req.user, { _id: req.params.id });

    if (req.user.role === 'teacher') delete req.body.teacherId;

    const classItem = await Class.findOneAndUpdate(
        filter,
        { $set: req.body },
        { new: true, runValidators: true }
    );

    if (!classItem) {
        return sendError(res, 'Class not found or access denied.', 404);
    }

    return sendSuccess(res, { class: classItem }, 'Class updated successfully');
});

/**
 * @route   DELETE /api/classes/:id
 * @access  Private
 */
const deleteClass = asyncHandler(async (req, res) => {
    const filter = await getScopeFilter(req.user, { _id: req.params.id });

    const classItem = await Class.findOneAndDelete(filter);
    if (!classItem) {
        return sendError(res, 'Class not found or access denied.', 404);
    }

    return sendSuccess(res, null, 'Class deleted successfully');
});

/**
 * @route   POST /api/classes/bulk
 * @access  Private [Admin/Teacher]
 */
const bulkCreateClasses = asyncHandler(async (req, res) => {
    const { classes, studentId, subject, duration, amount, notes, teacherId: bodyTeacherId } = req.body;
    if (!Array.isArray(classes)) {
        return sendError(res, 'Invalid request. "classes" must be an array.', 400);
    }

    const teacherId = req.user.role === 'teacher' ? req.user._id : bodyTeacherId;
    
    const preparedClasses = classes.map(c => ({
        studentId: studentId || c.studentId,
        subject: subject || c.subject,
        duration: duration || c.duration,
        amount: amount || (c.amount !== undefined ? c.amount : 0),
        notes: notes || c.notes,
        ...c,
        teacherId: teacherId || c.teacherId || (req.user.role === 'teacher' ? req.user._id : null),
        status: c.status || 'scheduled'
    }));

    // Ensure all prepared classes have a teacherId
    const missingTeacher = preparedClasses.some(c => !c.teacherId);
    if (missingTeacher) {
        return sendError(res, 'teacherId is required for all classes.', 400);
    }

    const createdClasses = await Class.insertMany(preparedClasses);
    return sendSuccess(res, { classes: createdClasses }, `${createdClasses.length} classes created successfully`, 201);
});

/**
 * @route   POST /api/classes/start or /api/classes/:id/start
 * @access  Private [Teacher]
 */
const startClass = asyncHandler(async (req, res) => {
    const id = req.params.id || req.body.classId || req.body.id;
    if (!id) return sendError(res, 'Class ID is required.', 400);

    const filter = await getScopeFilter(req.user, { _id: id });
    const classItem = await Class.findOne(filter);

    if (!classItem) {
        return sendError(res, 'Class not found or access denied.', 404);
    }

    classItem.status = 'ongoing';
    classItem.actualStartTime = new Date();
    classItem.conducted = true;
    await classItem.save();

    return sendSuccess(res, { class: classItem }, 'Class marked as ongoing.');
});

/**
 * @route   POST /api/classes/end or /api/classes/:id/end
 * @access  Private [Teacher]
 */
const endClass = asyncHandler(async (req, res) => {
    const id = req.params.id || req.body.classId || req.body.id;
    if (!id) return sendError(res, 'Class ID is required.', 400);

    const filter = await getScopeFilter(req.user, { _id: id });
    const classItem = await Class.findOne(filter);

    if (!classItem) {
        return sendError(res, 'Class not found or access denied.', 404);
    }

    classItem.status = 'completed';
    classItem.actualEndTime = new Date();
    await classItem.save();

    return sendSuccess(res, { class: classItem }, 'Class marked as completed.');
});

/**
 * @route   POST /api/classes/join or /api/classes/:id/join
 * @access  Private [Student]
 */
const joinClass = asyncHandler(async (req, res) => {
    const id = req.params.id || req.body.classId || req.body.id;
    if (!id) return sendError(res, 'Class ID is required.', 400);

    // Filter to ensure student can only join classes they are assigned to
    const filter = await getScopeFilter(req.user, { _id: id });
    const classItem = await Class.findOne(filter);

    if (!classItem) {
        return sendError(res, 'Class not found or access denied.', 404);
    }

    // Add entry to studentJoins
    const studentId = req.user.role === 'student' ? req.user._id : req.body.studentId;
    classItem.studentJoins.push({
        studentId,
        joinedAt: new Date()
    });
    
    await classItem.save();
    return sendSuccess(res, { class: classItem }, 'Joined class successfully.');
});

module.exports = { 
    createClass, 
    getAllClasses, 
    getClassById, 
    updateClass, 
    deleteClass,
    startClass,
    endClass,
    joinClass,
    bulkCreateClasses
};
