const mongoose = require('mongoose');

/**
 * Builds a Mongoose filter object from common query parameters.
 * Supports: date (exact), startDate/endDate (range), teacherId, studentId, status.
 * @param {object} query - Express req.query
 * @param {string} dateField - The field name to apply date filtering on (default: 'date')
 * @returns {object} Mongoose filter object
 */
const buildFilter = (query, dateField = 'date') => {
    const filter = {};

    // Date range filtering
    if (query.startDate || query.endDate) {
        filter[dateField] = {};
        if (query.startDate) {
            filter[dateField].$gte = new Date(query.startDate);
        }
        if (query.endDate) {
            // Include the entire end day
            const endDate = new Date(query.endDate);
            endDate.setHours(23, 59, 59, 999);
            filter[dateField].$lte = endDate;
        }
    } else if (query.date) {
        // Exact date: match entire day
        const start = new Date(query.date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(query.date);
        end.setHours(23, 59, 59, 999);
        filter[dateField] = { $gte: start, $lte: end };
    }

    // Teacher filter (admin use)
    if (query.teacherId && mongoose.Types.ObjectId.isValid(query.teacherId)) {
        filter.teacherId = query.teacherId;
    }

    // Student filter
    if (query.studentId && mongoose.Types.ObjectId.isValid(query.studentId)) {
        filter.studentId = query.studentId;
    }

    // Status filter
    if (query.status) {
        filter.status = query.status;
    }

    return filter;
};

module.exports = { buildFilter };
