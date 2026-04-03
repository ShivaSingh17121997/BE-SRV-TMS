const express = require('express');
const { register, login } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// POST /api/auth/register — Public or Super Admin token for privileged roles
router.post('/register', (req, res, next) => {
    // Optionally pass authenticated user context if token is present
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authenticate(req, res, () => register(req, res, next));
    }
    return next();
}, register);

// POST /api/auth/login — Public
router.post('/login', login);

module.exports = router;
