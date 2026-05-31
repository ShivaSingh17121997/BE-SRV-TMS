const User = require('../models/user.model');
const Student = require('../models/student.model');
const Class = require('../models/class.model');
const { sendSuccess, sendError } = require('../utils/response.util');
const { getPagination, buildPaginationMeta } = require('../utils/pagination.util');
const asyncHandler = require('../utils/asyncHandler.util');

/**
 * @route   GET /api/teachers
 * @desc    Get all teachers (Admin / Super Admin only)
 * @access  Private [admin, super_admin]
 */
const getAllTeachers = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);

    const filter = { role: 'teacher' };

    // Search by name, email, city, or subjects
    if (req.query.search) {
        const regex = new RegExp(req.query.search, 'i');
        filter.$or = [
            { name: regex },
            { email: regex },
            { city: regex },
            { subjects: regex },
        ];
    }

    // Filter by city
    if (req.query.city) {
        filter.city = new RegExp(req.query.city, 'i');
    }

    // Filter by subject
    if (req.query.subject) {
        filter.subjects = new RegExp(req.query.subject, 'i');
    }

    // Filter by status (active / inactive)
    if (req.query.status) {
        filter.status = req.query.status;
    }

    // Sorting
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const allowedSortFields = ['createdAt', 'name', 'email', 'city'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [teachers, total] = await Promise.all([
        User.find(filter)
            .select('-password')
            .skip(skip)
            .limit(limit)
            .sort({ [safeSortBy]: sortOrder }),
        User.countDocuments(filter),
    ]);

    return sendSuccess(res, {
        teachers,
        pagination: buildPaginationMeta(total, page, limit),
    });
});

/**
 * @route   GET /api/teachers/:id
 * @desc    Get teacher by ID. Teacher can only access their own profile.
 * @access  Private [admin, super_admin, teacher(self)]
 */
const getTeacherById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Teacher can only view their own profile
    if (req.user.role === 'teacher' && req.user._id.toString() !== id) {
        return sendError(res, 'You can only access your own profile.', 403);
    }

    const teacher = await User.findOne({ _id: id, role: 'teacher' }).select('-password');
    if (!teacher) {
        return sendError(res, 'Teacher not found.', 404);
    }

    return sendSuccess(res, { teacher });
});

/**
 * @route   PATCH /api/teachers/:id
 * @desc    Update teacher profile. Teacher can only update their own. Admin can update any.
 * @access  Private [admin, super_admin, teacher(self)]
 */
const updateTeacher = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Teacher can only update their own profile
    if (req.user.role === 'teacher' && req.user._id.toString() !== id) {
        return sendError(res, 'You can only update your own profile.', 403);
    }

    // Extract password to handle separately as it needs hashing via User model pre-save hook
    const { password, ...updateData } = req.body;

    // Fields that cannot be updated by a teacher
    if (req.user.role === 'teacher') {
        const forbidden = ['role', 'email'];
        forbidden.forEach((field) => delete updateData[field]);
    }

    const teacher = await User.findOneAndUpdate(
        { _id: id, role: 'teacher' },
        { $set: updateData },
        { new: true, runValidators: true }
    ).select('-password');

    if (!teacher) {
        return sendError(res, 'Teacher not found.', 404);
    }

    // Handle password update if password is provided by admin/super_admin
    if (password && req.user.role !== 'teacher') {
        const user = await User.findById(id);
        if (user) {
            user.password = password;
            await user.save();
        }
    }

    return sendSuccess(res, { teacher }, 'Teacher updated successfully');
});

/**
 * @route   DELETE /api/teachers/:id
 * @desc    Delete teacher. Cascades: students are set to unassigned (teacherId=null),
 *          classes are soft-orphaned (teacherId=null). Admin / Super Admin only.
 * @access  Private [admin, super_admin]
 */
const deleteTeacher = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const teacher = await User.findOne({ _id: id, role: 'teacher' });
    if (!teacher) {
        return sendError(res, 'Teacher not found.', 404);
    }

    // Cascade: nullify teacherId references so records aren't orphaned
    await Promise.all([
        Student.updateMany({ teacherId: id }, { $set: { teacherId: null, status: 'inactive' } }),
        Class.updateMany({ teacherId: id }, { $set: { teacherId: null } }),
        User.findByIdAndDelete(id),
    ]);

    return sendSuccess(res, null, 'Teacher deleted successfully. Associated students set to inactive.');
});

/**
 * @route   PATCH /api/teachers/:id/change-password
 * @desc    Change teacher password
 * @access  Private [admin, super_admin, teacher(self)]
 */
const changePassword = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Teacher can only update their own password
    if (req.user.role === 'teacher' && req.user._id.toString() !== id) {
        return sendError(res, 'You can only update your own password.', 403);
    }

    const user = await User.findById(id).select('+password');
    if (!user) {
        return sendError(res, 'Teacher not found.', 404);
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        return sendError(res, 'Invalid current password.', 400);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return sendSuccess(res, null, 'Password updated successfully');
});

module.exports = { getAllTeachers, getTeacherById, updateTeacher, deleteTeacher, changePassword };
