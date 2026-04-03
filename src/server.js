const app = require('./app');
const connectDB = require('./config/db');
const { PORT } = require('./config/env');
const { initCron } = require('./utils/cron');

const startServer = async () => {
    await connectDB();
    initCron();
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
};

startServer();
