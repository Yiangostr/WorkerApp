import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
  redisPub: Redis | undefined;
  redisSub: Redis | undefined;
};

function createRedisClient(name: string): Redis {
  const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const client = new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });

  client.on('connect', () => console.log(`[Redis:${name}] Connected`));
  client.on('error', (err: Error) => console.error(`[Redis:${name}] Error:`, err.message));

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient('main');
export const redisPub = globalForRedis.redisPub ?? createRedisClient('pub');
export const redisSub = globalForRedis.redisSub ?? createRedisClient('sub');

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
  globalForRedis.redisPub = redisPub;
  globalForRedis.redisSub = redisSub;
}

export { Redis };
