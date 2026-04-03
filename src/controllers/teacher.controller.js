const User = require('../models/user.model');
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

    // Optional search by name or city
    if (req.query.search) {
        const regex = new RegExp(req.query.search, 'i');
        filter.$or = [{ name: regex }, { city: regex }];
    }
    if (req.query.city) {
        filter.city = new RegExp(req.query.city, 'i');
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

    // Fields that cannot be updated by a teacher
    if (req.user.role === 'teacher') {
        const forbidden = ['password', 'role', 'email'];
        forbidden.forEach((field) => delete req.body[field]);
    }

    const teacher = await User.findOneAndUpdate(
        { _id: id, role: 'teacher' },
        { $set: req.body },
        { new: true, runValidators: true }
    ).select('-password');

    if (!teacher) {
        return sendError(res, 'Teacher not found.', 404);
    }

    return sendSuccess(res, { teacher }, 'Teacher updated successfully');
});

/**
 * @route   DELETE /api/teachers/:id
 * @desc    Delete teacher profile. Admin / Super Admin only.
 * @access  Private [admin, super_admin]
 */
const deleteTeacher = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const teacher = await User.findOneAndDelete({ _id: id, role: 'teacher' });

    if (!teacher) {
        return sendError(res, 'Teacher not found.', 404);
    }
    return sendSuccess(res, null, 'Teacher deleted successfully');
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
