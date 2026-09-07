const { Redis } = require('ioredis');
const dotenv = require('dotenv');

dotenv.config();

// Create a robust Redis connection using environment variables
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
});

redis.on('connect', () => {
  console.log('✅ Successfully connected to Redis');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

module.exports = redis;
