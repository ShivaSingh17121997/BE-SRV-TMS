const express = require('express');
const { createReport, getAllReports, getReportById, updateReport, deleteReport } = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.post('/', createReport);
router.get('/', getAllReports);
router.get('/:id', getReportById);
router.patch('/:id', updateReport);
router.delete('/:id', deleteReport);

module.exports = router;
