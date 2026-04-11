const express = require('express');
const { submitFeedback, getAllFeedbacks, deleteFeedback } = require('../controllers/feedback.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Public route for form submission
router.post('/submit', submitFeedback);

// Protected routes for admins
router.use(authenticate);
router.use(authorize('super_admin', 'admin'));

router.route('/')
    .get(getAllFeedbacks);

router.route('/:id')
    .delete(deleteFeedback);

module.exports = router;
