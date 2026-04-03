const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { sendSuccess, sendError } = require('../utils/response.util');
const asyncHandler = require('../utils/asyncHandler.util');

/**
 * Generate a signed JWT token for a user.
 */
const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public (Super Admin can set any role; others default to teacher)
 */
const register = asyncHandler(async (req, res) => {
    const { name, email, password, role, phone, city, subjects, qualification, experience, bio } =
        req.body;

    // Only super_admin can assign roles other than 'teacher'
    let assignedRole = 'teacher';
    if (role && ['admin', 'super_admin'].includes(role)) {
        // If no authenticated user (public registration), force teacher role
        if (!req.user || req.user.role !== 'super_admin') {
            return sendError(res, 'Only Super Admin can assign admin or super_admin roles.', 403);
        }
        assignedRole = role;
    } else if (role === 'teacher') {
        assignedRole = 'teacher';
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return sendError(res, 'A user with this email already exists.', 409);
    }

    const user = await User.create({
        name,
        email,
        password,
        role: assignedRole,
        phone,
        city,
        subjects,
        qualification,
        experience,
        bio,
    });

    const token = generateToken(user);

    return sendSuccess(
        res,
        {
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                city: user.city,
                googleMeetLink: user.googleMeetLink,
            },
        },
        'User registered successfully',
        201
    );
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return sendError(res, 'Email and password are required.', 400);
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        return sendError(res, 'Invalid credentials.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return sendError(res, 'Invalid credentials.', 401);
    }

    const token = generateToken(user);

    return sendSuccess(res, {
        token,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            city: user.city,
            subjects: user.subjects,
            profilePhoto: user.profilePhoto,
            googleMeetLink: user.googleMeetLink,
        },
    }, 'Login successful');
});

module.exports = { register, login };
