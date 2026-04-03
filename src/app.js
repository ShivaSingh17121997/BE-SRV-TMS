const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const teacherRoutes = require('./routes/teacher.routes');
const studentRoutes = require('./routes/student.routes');
const classRoutes = require('./routes/class.routes');
const reportRoutes = require('./routes/report.routes');
const paymentRoutes = require('./routes/payment.routes');
const adminRoutes = require('./routes/admin.routes');
const homeworkRoutes = require('./routes/homework.routes');
const errorHandler = require('./middleware/errorHandler.middleware');
const { sendError } = require('./utils/response.util');

const app = express();

// ─── Security & Utility Middleware ───────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.status(200).json({ success: true, message: 'Teacher Management API is running 🚀' });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Teacher Management API is running 🚀', timestamp: new Date() });
});


// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/homework', homeworkRoutes);

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
    sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
});

// ─── Central Error Handler ───────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
