const Feedback = require('../models/feedback.model');
const { sendSuccess, sendError } = require('../utils/response.util');

// Public route to submit feedback
exports.submitFeedback = async (req, res, next) => {
    try {
        const { name, q1, q2, q3, q4, q5 } = req.body;
        
        if (!q1 || !q2 || !q4) {
            return sendError(res, 'Please answer the key questions before submitting.', 400);
        }

        const newFeedback = await Feedback.create({
            name: name || "Anonymous",
            rating: q1,
            teachingQuality: q2,
            whatTheyLike: q3 || [],
            improvement: q4,
            comment: q5 || "",
            ipAddress: req.ip || req.connection.remoteAddress
        });

        sendSuccess(res, newFeedback, 'Feedback submitted successfully', 201);
    } catch (error) {
        next(error);
    }
};

// Admin route to get all feedbacks
exports.getAllFeedbacks = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, search = '' } = req.query;
        const query = {};

        if (search) {
            query.$or = [
                { comment: { $regex: search, $options: 'i' } },
                { teachingQuality: { $regex: search, $options: 'i' } },
                { improvement: { $regex: search, $options: 'i' } }
            ];
        }

        const feedbacks = await Feedback.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Feedback.countDocuments(query);

        res.status(200).json({
            success: true,
            data: feedbacks,
            pagination: {
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Admin route to delete feedback
exports.deleteFeedback = async (req, res, next) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) {
            return sendError(res, 'Feedback not found', 404);
        }

        await feedback.deleteOne();
        sendSuccess(res, null, 'Feedback deleted successfully');
    } catch (error) {
        next(error);
    }
};
