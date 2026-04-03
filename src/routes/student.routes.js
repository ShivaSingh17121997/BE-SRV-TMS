const express = require('express');
const {
    createStudent, getAllStudents, getStudentById, updateStudent, deleteStudent, checkStudentEmail, changeStudentPassword
} = require('../controllers/student.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// All student routes require authentication
router.use(authenticate);

router.post('/check-email', checkStudentEmail);
router.post('/change-password', changeStudentPassword);

router.post('/', createStudent);
router.get('/', getAllStudents);
router.get('/:id', getStudentById);
router.patch('/:id', updateStudent);
router.delete('/:id', deleteStudent);

module.exports = router;
