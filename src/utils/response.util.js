/**
 * Sends a standardized success response.
 * @param {object} res - Express response object
 * @param {*} data - Payload data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default 200)
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
    const response = {
        success: true,
        message,
    };
    if (data !== null) {
        response.data = data;
    }
    return res.status(statusCode).json(response);
};

/**
 * Sends a standardized error response.
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default 500)
 * @param {*} errors - Additional error details
 */
const sendError = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
    const response = {
        success: false,
        message,
    };
    if (errors) {
        response.errors = errors;
    }
    return res.status(statusCode).json(response);
};

module.exports = { sendSuccess, sendError };
