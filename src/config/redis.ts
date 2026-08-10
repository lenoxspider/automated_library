import Redis from 'ioredis';
import 'dotenv/config';
import logger from './logger';

// Initialize Redis connection
export const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

redisClient.on('error', (err) => {
  logger.error({ err }, 'Redis client error');
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis successfully');
});

export default redisClient;
