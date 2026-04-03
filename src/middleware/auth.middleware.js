const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { JWT_SECRET } = require('../config/env');
const { sendError } = require('../utils/response.util');
const asyncHandler = require('../utils/asyncHandler.util');

/**
 * authenticate - Verifies Bearer JWT and attaches req.user
 */
const authenticate = asyncHandler(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return sendError(res, 'Access denied. No token provided.', 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
        return sendError(res, 'Token is invalid or user no longer exists.', 401);
    }

    req.user = user;
    next();
});

/**
 * authorize - Role-based access control middleware factory.
 * Usage: authorize('admin', 'super_admin')
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return sendError(
                res,
                `Access forbidden. Required role(s): ${roles.join(', ')}`,
                403
            );
        }
        next();
    };
};

module.exports = { authenticate, authorize };
