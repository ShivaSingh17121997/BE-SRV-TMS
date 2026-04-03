const app = require('../src/app');
const connectDB = require('../src/config/db');

module.exports = async (req, res) => {
    try {
        await connectDB();
    } catch (err) {
        console.error('Database connection error in Vercel handler:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error: Database connection failed',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
    return app(req, res);
};
