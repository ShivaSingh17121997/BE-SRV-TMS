const express = require('express');
const { getAllTeachers, getTeacherById, updateTeacher, deleteTeacher, changePassword } = require('../controllers/teacher.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/teachers — Admin / Super Admin only
router.get('/', authenticate, authorize('admin', 'super_admin'), getAllTeachers);

// GET /api/teachers/:id — Admin can see any; teacher sees self
router.get('/:id', authenticate, authorize('admin', 'super_admin', 'teacher'), getTeacherById);

// PATCH /api/teachers/:id/change-password — Teacher updates self; Admin updates any
router.patch('/:id/change-password', authenticate, authorize('admin', 'super_admin', 'teacher'), changePassword);

// PATCH /api/teachers/:id — Teacher updates self; Admin updates any
router.patch('/:id', authenticate, authorize('admin', 'super_admin', 'teacher'), updateTeacher);

// DELETE /api/teachers/:id — Admin / Super Admin only
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), deleteTeacher);

module.exports = router;
