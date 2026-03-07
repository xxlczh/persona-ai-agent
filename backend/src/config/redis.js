const Redis = require('ioredis');
require('dotenv').config();

// 创建 Redis 客户端实例
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true
});

// 连接错误处理
redis.on('error', (err) => {
  console.error('Redis 连接错误:', err.message);
});

// 连接成功事件
redis.on('connect', () => {
  console.log('Redis 连接成功');
});

// 断开连接事件
redis.on('close', () => {
  console.log('Redis 连接已关闭');
});

module.exports = redis;
