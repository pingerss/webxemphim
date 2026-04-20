'use strict';

const Redis = require('ioredis');
const logger = require('./logger');

let redisClient;

function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis chưa được khởi tạo. Gọi connectRedis() trước.');
  }
  return redisClient;
}

async function connectRedis() {
  const host = process.env.REDIS_HOST || 'localhost';
  // Upstash và các cloud Redis đều cần TLS
  const isCloudRedis = host.includes('upstash.io') || host.includes('redislabs.com') || host.includes('redis.cloud');

  redisClient = new Redis({
    host,
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    // Bật TLS khi dùng Upstash/Cloud Redis
    ...(isCloudRedis && { tls: {} }),
    retryStrategy: (times) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
  });

  redisClient.on('error', (err) => logger.error('Redis error:', err.message));
  redisClient.on('connect', () => logger.info('Redis client connected'));

  // ping to verify
  await redisClient.ping();
  return redisClient;
}

module.exports = { connectRedis, getRedisClient };
