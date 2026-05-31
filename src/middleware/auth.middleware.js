const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { JWT_SECRET } = require('../config/env');
const { sendError } = require('../utils/response.util');
const asyncHandler = require('../utils/asyncHandler.util');
const getRedis = require('../utils/redis');

/**
 * authenticate - Verifies Bearer JWT and attaches req.user
 * Uses Redis to cache user lookups — eliminates one DB round-trip per request.
 * Falls back to DB if Redis is unavailable.
 */
const authenticate = asyncHandler(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return sendError(res, 'Access denied. No token provided.', 401);
    }

    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return sendError(res, 'Token is invalid or expired.', 401);
    }

    const cacheKey = `session:${decoded.id}`;
    let user = null;

    // Try Redis first
    try {
        const redis = getRedis();
        const cached = await redis.get(cacheKey);
        if (cached) {
            user = JSON.parse(cached);
        }
    } catch (_) { /* Redis unavailable — fall through */ }

    // Fall back to DB if not cached
    if (!user) {
        user = await User.findById(decoded.id).select('-password').lean();
        if (!user) {
            return sendError(res, 'Token is invalid or user no longer exists.', 401);
        }

        // Cache for the remaining JWT lifetime (~8h = 28800s)
        try {
            const redis = getRedis();
            await redis.setex(cacheKey, 28800, JSON.stringify(user));
        } catch (_) { /* Redis write failed — ignore */ }
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

/**
 * Bust cached user session — call this after profile updates.
 * @param {string} userId
 */
const bustUserSession = async (userId) => {
    try {
        const redis = getRedis();
        await redis.del(`session:${userId}`);
    } catch (_) {}
};

module.exports = { authenticate, authorize, bustUserSession };
