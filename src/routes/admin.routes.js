const express = require('express');
const { getAllTeachers, getAllStudents, getAllClasses, getDashboardStats } = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All admin routes require authentication and admin/super_admin role
router.use(authenticate, authorize('admin', 'super_admin'));

router.get('/stats', getDashboardStats);
router.get('/teachers', getAllTeachers);
router.get('/students', getAllStudents);
router.get('/classes', getAllClasses);

module.exports = router;
