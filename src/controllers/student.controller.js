const Student = require('../models/student.model');
const User = require('../models/user.model');
const { sendSuccess, sendError } = require('../utils/response.util');
const { getPagination, buildPaginationMeta } = require('../utils/pagination.util');
const { buildFilter } = require('../utils/filter.util');
const asyncHandler = require('../utils/asyncHandler.util');

/**
 * Build a role-scoped filter.
 */
const getScopeFilter = async (user, query) => {
    const filter = buildFilter(query, 'createdAt');
    if (user.role === 'teacher') {
        filter.teacherId = user._id;
    } else if (user.role === 'student') {
        const student = await Student.findOne({ userId: user._id });
        if (student) filter._id = student._id;
        else filter._id = null; // Force empty result if unlinked
    } else if (query.teacherId) {
        filter.teacherId = query.teacherId;
    }
    return filter;
};

/**
 * @route   POST /api/students
 * @desc    Create a new student (automatically assigned to logged-in teacher)
 * @access  Private [teacher, admin, super_admin]
 */
const createStudent = asyncHandler(async (req, res) => {
    const {
        name, class: studentClass, school, parentName, parentPhone,
        email, password, subject, feePerClass, startDate, status, notes,
    } = req.body;

    // Teacher ID comes from the authenticated user for teachers
    const teacherId =
        req.user.role === 'teacher' ? req.user._id : req.body.teacherId;

    if (!teacherId) {
        return sendError(res, 'teacherId is required for admin-created students.', 400);
    }

    // Check if email is provided to create a login account
    let userId = undefined;
    let existingUserMessage = undefined;
    if (email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // ✅ Student already has a portal account — reuse the same User ID.
            // This allows multiple teachers to enroll the same student.
            userId = existingUser._id;
            existingUserMessage = 'Student linked to existing portal account successfully';
        } else {
            // New student — create a fresh login account
            const newUser = await User.create({
                name,
                email,
                password: password || 'student123',
                role: 'student',
                phone: parentPhone
            });
            userId = newUser._id;
        }
    }

    const student = await Student.create({
        name, class: studentClass, school, parentName, parentPhone,
        email, subject, feePerClass, teacherId, userId, startDate, status, notes,
    });

    return sendSuccess(res, { student }, existingUserMessage || 'Student created successfully', 201);
});

/**
 * @route   POST /api/students/check-email
 * @desc    Check if an email is already registered as a user
 * @access  Private [teacher, admin]
 */
const checkStudentEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) return sendError(res, 'Email is required', 400);

    const existingUser = await User.findOne({ email });
    return sendSuccess(res, { 
        exists: !!existingUser, 
        user: existingUser ? { name: existingUser.name } : null 
    });
});

/**
 * @route   GET /api/students
 * @desc    Get all students. Teachers get their own; admins get all.
 * @access  Private
 */
const getAllStudents = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = await getScopeFilter(req.user, req.query);

    // Optional search by name
    if (req.query.search) {
        filter.name = new RegExp(req.query.search, 'i');
    }

    const [students, total] = await Promise.all([
        Student.find(filter)
            .populate('teacherId', 'name email googleMeetLink')
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
 * @route   GET /api/students/:id
 * @desc    Get student by ID (scoped by ownership for teachers)
 * @access  Private
 */
const getStudentById = asyncHandler(async (req, res) => {
    const filter = await getScopeFilter(req.user, { _id: req.params.id });

    const student = await Student.findOne(filter).populate('teacherId', 'name email googleMeetLink');
    if (!student) {
        return sendError(res, 'Student not found or access denied.', 404);
    }

    return sendSuccess(res, { student });
});

/**
 * @route   PATCH /api/students/:id
 * @desc    Update student (scoped by ownership for teachers)
 * @access  Private
 */
const updateStudent = asyncHandler(async (req, res) => {
    const filter = await getScopeFilter(req.user, { _id: req.params.id });

    // Extract password to handle separately as it's in the User model
    const { password, ...updateData } = req.body;

    // Prevent reassigning teacherId by a teacher
    if (req.user.role === 'teacher') delete updateData.teacherId;

    const student = await Student.findOneAndUpdate(
        filter,
        { $set: updateData },
        { new: true, runValidators: true }
    );

    if (!student) {
        return sendError(res, 'Student not found or access denied.', 404);
    }

    // Handle password update if password is provided
    if (password && student.userId) {
        const user = await User.findById(student.userId);
        if (user) {
            user.password = password;
            await user.save();
        }
    }

    return sendSuccess(res, { student }, 'Student updated successfully');
});

/**
 * @route   DELETE /api/students/:id
 * @desc    Delete student (scoped by ownership for teachers)
 * @access  Private
 */
const deleteStudent = asyncHandler(async (req, res) => {
    const filter = await getScopeFilter(req.user, { _id: req.params.id });

    // Find the student first to check status
    const studentExists = await Student.findOne(filter);
    if (!studentExists) {
        return sendError(res, 'Student not found or access denied.', 404);
    }

    // Check if student is active
    if (studentExists.status === 'active') {
        return sendError(res, 'Student is active and cannot be deleted. Deactivate first.', 400);
    }

    const student = await Student.findOneAndDelete(filter);
    return sendSuccess(res, null, 'Student deleted successfully');
});

/**
 * @route   POST /api/students/change-password
 * @desc    Change student password by email
 * @access  Private [student, teacher, super_admin, admin]
 */
const changeStudentPassword = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return sendError(res, 'Email and new password are required.', 400);
    }

    const user = await User.findOne({ email, role: 'student' });
    if (!user) {
        return sendError(res, 'Student account not found with this email.', 404);
    }

    // Permission check
    const requester = req.user;
    if (requester.role === 'super_admin' || requester.role === 'admin') {
        // Full access for admins
    } else if (requester.role === 'student') {
        // Students can only change their own
        if (requester.email !== email) {
            return sendError(res, 'You can only change your own password.', 403);
        }
    } else if (requester.role === 'teacher') {
        // Verifying student is taught by this teacher
        const studentRecord = await Student.findOne({ userId: user._id, teacherId: requester._id });
        if (!studentRecord) {
            return sendError(res, 'Access denied: This student is not assigned to you.', 403);
        }
    } else {
        return sendError(res, 'Permission denied.', 403);
    }

    user.password = password;
    await user.save();

    return sendSuccess(res, null, 'Password changed successfully');
});

module.exports = { createStudent, getAllStudents, getStudentById, updateStudent, deleteStudent, checkStudentEmail, changeStudentPassword };
