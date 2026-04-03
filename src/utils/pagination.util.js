/**
 * Extracts pagination parameters from query string and returns
 * skip, limit and page for Mongoose queries.
 * @param {object} query - Express req.query
 * @returns {{ page: number, limit: number, skip: number }}
 */
const getPagination = (query) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

/**
 * Builds a pagination meta object to include in responses.
 * @param {number} total - Total document count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} pagination meta
 */
const buildPaginationMeta = (total, page, limit) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
});

module.exports = { getPagination, buildPaginationMeta };
