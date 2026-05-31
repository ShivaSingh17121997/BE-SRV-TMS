const express = require('express');
const {
    createOnboarding,
    getAllOnboardings,
    getOnboardingById,
    updateOnboarding,
    deleteOnboarding,
} = require('../controllers/teacherOnboarding.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
// POST /api/onboarding/teacher — No auth. Anyone with the link can submit.
router.post('/teacher', createOnboarding);

// ── Protected (Admin / Super Admin) ──────────────────────────────────────────
// GET  /api/onboarding/teacher       — List all submissions
router.get('/teacher', authenticate, authorize('admin', 'super_admin'), getAllOnboardings);

// GET  /api/onboarding/teacher/:id   — Get single submission
router.get('/teacher/:id', authenticate, authorize('admin', 'super_admin'), getOnboardingById);

// PATCH /api/onboarding/teacher/:id  — Update status / fields
router.patch('/teacher/:id', authenticate, authorize('admin', 'super_admin'), updateOnboarding);

// DELETE /api/onboarding/teacher/:id — Delete submission
router.delete('/teacher/:id', authenticate, authorize('admin', 'super_admin'), deleteOnboarding);

module.exports = router;
