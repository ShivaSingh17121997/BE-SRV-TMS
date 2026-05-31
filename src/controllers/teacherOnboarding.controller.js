const TeacherOnboarding = require('../models/teacherOnboarding.model');
const { sendSuccess, sendError } = require('../utils/response.util');
const { getPagination, buildPaginationMeta } = require('../utils/pagination.util');
const asyncHandler = require('../utils/asyncHandler.util');

/**
 * @route   POST /api/onboarding/teacher
 * @desc    Submit teacher onboarding form. PUBLIC — no auth required.
 * @access  Public
 */
const createOnboarding = asyncHandler(async (req, res) => {
    const {
        // Step 1 — Personal
        fullName, alias, gender, dob, mobile, whatsapp, email,
        address, city, pin,
        // Step 2 — Teaching
        qualification, stream, university, passYear, experience,
        mode, subjects, boards, rate, prevInstitutions, bio,
        // Step 3 — Bank
        accName, accNumber, ifsc, bankName, branch, accType,
        upiId, payMethod, payCycle,
        // Step 4 — Documents
        aadhaar, pan, emergName, emergPhone, emergRelation, notes,
    } = req.body;

    // Basic required field validation
    const missing = [];
    if (!fullName) missing.push('fullName');
    if (!gender) missing.push('gender');
    if (!dob) missing.push('dob');
    if (!mobile) missing.push('mobile');
    if (!email) missing.push('email');
    if (!address) missing.push('address');
    if (!city) missing.push('city');
    if (!pin) missing.push('pin');
    if (!qualification) missing.push('qualification');
    if (!university) missing.push('university');
    if (!experience) missing.push('experience');
    if (!mode) missing.push('mode');
    if (!rate) missing.push('rate');
    if (!accName) missing.push('accName');
    if (!accNumber) missing.push('accNumber');
    if (!ifsc) missing.push('ifsc');
    if (!bankName) missing.push('bankName');
    if (!accType) missing.push('accType');
    if (!payMethod) missing.push('payMethod');
    if (!aadhaar) missing.push('aadhaar');
    if (!emergName) missing.push('emergName');
    if (!emergPhone) missing.push('emergPhone');

    if (missing.length > 0) {
        return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
    }

    // Mobile & PIN format validation
    if (!/^\d{10}$/.test(mobile)) {
        return sendError(res, 'Mobile must be a 10-digit number', 400);
    }
    if (!/^\d{6}$/.test(pin)) {
        return sendError(res, 'PIN must be a 6-digit number', 400);
    }
    if (!/^\d{12}$/.test(aadhaar)) {
        return sendError(res, 'Aadhaar must be a 12-digit number', 400);
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc)) {
        return sendError(res, 'Invalid IFSC code format', 400);
    }

    const onboarding = await TeacherOnboarding.create({
        fullName, alias, gender, dob, mobile, whatsapp, email,
        address, city, pin,
        qualification, stream, university, passYear, experience,
        mode, subjects: subjects || [], boards, rate: Number(rate),
        prevInstitutions, bio,
        accName, accNumber, ifsc: ifsc.toUpperCase(), bankName, branch,
        accType, upiId, payMethod, payCycle,
        aadhaar, pan: pan ? pan.toUpperCase() : undefined, emergName,
        emergPhone, emergRelation, notes,
        status: 'pending',
    });

    return sendSuccess(
        res,
        { onboarding: { _id: onboarding._id, fullName: onboarding.fullName, email: onboarding.email, status: onboarding.status } },
        'Teacher onboarding form submitted successfully',
        201
    );
});

/**
 * @route   GET /api/onboarding/teacher
 * @desc    Get all onboarding submissions (paginated, searchable)
 * @access  Private [admin, super_admin]
 */
const getAllOnboardings = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};

    // Search by name, email, city
    if (req.query.search) {
        const regex = new RegExp(req.query.search, 'i');
        filter.$or = [
            { fullName: regex },
            { email: regex },
            { city: regex },
            { mobile: regex },
        ];
    }

    // Filter by status
    if (req.query.status) {
        filter.status = req.query.status;
    }

    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const allowedSort = ['createdAt', 'fullName', 'email', 'city', 'status'];
    const safeSortBy = allowedSort.includes(sortBy) ? sortBy : 'createdAt';

    const [onboardings, total] = await Promise.all([
        TeacherOnboarding.find(filter)
            .sort({ [safeSortBy]: sortOrder })
            .skip(skip)
            .limit(limit)
            .lean(),
        TeacherOnboarding.countDocuments(filter),
    ]);

    return sendSuccess(res, {
        onboardings,
        pagination: buildPaginationMeta(total, page, limit),
    });
});

/**
 * @route   GET /api/onboarding/teacher/:id
 * @desc    Get single onboarding submission
 * @access  Private [admin, super_admin]
 */
const getOnboardingById = asyncHandler(async (req, res) => {
    const onboarding = await TeacherOnboarding.findById(req.params.id).lean();
    if (!onboarding) {
        return sendError(res, 'Onboarding record not found', 404);
    }
    return sendSuccess(res, { onboarding });
});

/**
 * @route   PATCH /api/onboarding/teacher/:id
 * @desc    Update onboarding status or fields
 * @access  Private [admin, super_admin]
 */
const updateOnboarding = asyncHandler(async (req, res) => {
    const { status, ...rest } = req.body;

    const updateData = { ...rest };
    if (status) {
        updateData.status = status;
        updateData.reviewedBy = req.user._id;
        updateData.reviewedAt = new Date();
    }

    const onboarding = await TeacherOnboarding.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true, runValidators: true }
    ).lean();

    if (!onboarding) {
        return sendError(res, 'Onboarding record not found', 404);
    }

    return sendSuccess(res, { onboarding }, 'Onboarding record updated successfully');
});

/**
 * @route   DELETE /api/onboarding/teacher/:id
 * @desc    Delete onboarding submission
 * @access  Private [admin, super_admin]
 */
const deleteOnboarding = asyncHandler(async (req, res) => {
    const onboarding = await TeacherOnboarding.findByIdAndDelete(req.params.id);
    if (!onboarding) {
        return sendError(res, 'Onboarding record not found', 404);
    }
    return sendSuccess(res, null, 'Onboarding record deleted successfully');
});

module.exports = {
    createOnboarding,
    getAllOnboardings,
    getOnboardingById,
    updateOnboarding,
    deleteOnboarding,
};
