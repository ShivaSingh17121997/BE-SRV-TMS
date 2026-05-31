const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const teacherRoutes = require('./routes/teacher.routes');
const studentRoutes = require('./routes/student.routes');
const classRoutes = require('./routes/class.routes');
const reportRoutes = require('./routes/report.routes');
const paymentRoutes = require('./routes/payment.routes');
const adminRoutes = require('./routes/admin.routes');
const homeworkRoutes = require('./routes/homework.routes');
const onboardingRoutes = require('./routes/teacherOnboarding.routes');
const errorHandler = require('./middleware/errorHandler.middleware');
const { sendError } = require('./utils/response.util');

const app = express();

// ─── Security & Utility Middleware ───────────────────────────────────────────
app.use(helmet());

// CORS — whitelist origins from env
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow server-to-server calls (no origin) and whitelisted origins
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: Origin "${origin}" not allowed`));
        }
    },
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Auth routes: 10 attempts per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // Increased from 10 to 100 for dev/testing ease
    message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Global API: 200 requests per minute
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    message: { success: false, message: 'Too many requests, please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.status(200).json({ success: true, message: 'Teacher Management API is running 🚀' });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Teacher Management API is running 🚀', timestamp: new Date() });
});


// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/teachers', apiLimiter, teacherRoutes);
app.use('/api/students', apiLimiter, studentRoutes);
app.use('/api/classes', apiLimiter, classRoutes);
app.use('/api/reports', apiLimiter, reportRoutes);
app.use('/api/payments', apiLimiter, paymentRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/homework', apiLimiter, homeworkRoutes);
app.use('/api/feedbacks', apiLimiter, require('./routes/feedback.routes'));
app.use('/api/onboarding', apiLimiter, onboardingRoutes);

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
    sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
});

// ─── Central Error Handler ───────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;

