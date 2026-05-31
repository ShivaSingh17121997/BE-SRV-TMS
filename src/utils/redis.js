/**
 * Redis singleton client.
 * Gracefully degrades — if Redis is unavailable, all operations are no-ops.
 * Uses ioredis for auto-reconnect and promise-based API.
 */

let redisClient = null;
let redisAvailable = false;

const getRedis = () => {
    if (redisClient) return redisClient;

    try {
        const Redis = require('ioredis');

        redisClient = new Redis({
            host: process.env.REDIS_HOST || '127.0.0.1',
            port: parseInt(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            lazyConnect: true,
            connectTimeout: 2000,
            maxRetriesPerRequest: 1,
            retryStrategy: (times) => {
                // Stop retrying after 3 attempts (don't spam logs)
                if (times > 3) return null;
                return Math.min(times * 200, 1000);
            },
        });

        redisClient.on('connect', () => {
            redisAvailable = true;
            console.log('[Redis] Connected ✓');
        });

        redisClient.on('error', (err) => {
            if (redisAvailable) {
                console.warn('[Redis] Connection lost — falling back to DB:', err.message);
                redisAvailable = false;
            }
        });

        redisClient.on('reconnecting', () => {
            console.log('[Redis] Reconnecting...');
        });

        // Attempt connection (non-blocking)
        redisClient.connect().catch(() => {});
    } catch (err) {
        // ioredis not installed — silently skip
        console.warn('[Redis] ioredis not found — caching disabled. Run: npm install ioredis');
        redisClient = createNoOpClient();
    }

    return redisClient;
};

/**
 * Returns a no-op Redis client that silently fails all operations.
 * Used when ioredis is not installed or Redis is unavailable.
 */
const createNoOpClient = () => ({
    get: async () => null,
    set: async () => null,
    setex: async () => null,
    del: async () => null,
    keys: async () => [],
});

module.exports = getRedis;
