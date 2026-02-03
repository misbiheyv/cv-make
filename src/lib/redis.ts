import Redis from 'ioredis';

const getRedisUrl = (): string => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }

  const host = process.env.REDIS_HOST || 'localhost';
  const port = process.env.REDIS_PORT || '6379';
  const password = process.env.REDIS_PASSWORD;

  if (password) {
    return `redis://:${password}@${host}:${port}`;
  }

  return `redis://${host}:${port}`;
};

class RedisClient {
  private static instance: Redis | null = null;
  private static connecting = false;

  static getInstance(): Redis {
    if (!RedisClient.instance) {
      const redisUrl = getRedisUrl();

      RedisClient.instance = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          if (times > 3) {
            return console.error('Redis: Max retry attempts reached');
          }

          const delay = times * 200;
          console.log(`Redis: Retry attempt ${times}, waiting ${delay}ms`);

          return delay;
        },
        lazyConnect: true,
        enableOfflineQueue: true,
        connectTimeout: 10000,
      });

      RedisClient.instance.on('connect', () => console.log('Redis: Connected successfully'));
      RedisClient.instance.on('ready', () => console.log('Redis: Ready to accept commands'));
      RedisClient.instance.on('error', (err) => console.error('Redis connection error:', err.message));
      RedisClient.instance.on('close', () => console.warn('Redis: Connection closed'));
      RedisClient.instance.on('reconnecting', () => console.log('Redis: Attempting to reconnect...'));
      RedisClient.instance.on('end', () => console.warn('Redis: Connection ended'));
    }

    return RedisClient.instance;
  }

  static async connect(): Promise<void> {
    if (RedisClient.connecting) {
      return;
    }

    RedisClient.connecting = true;

    try {
      await RedisClient.getInstance().connect();
      console.log('Redis: Initial connection established');
    } catch (error) {
      console.error('Redis: Failed to connect:', error);
    } finally {
      RedisClient.connecting = false;
    }
  }

  static async disconnect(): Promise<void> {
    if (RedisClient.instance) {
      await RedisClient.instance.quit();
      RedisClient.instance = null;
      console.log('Redis: Disconnected');
    }
  }

  static isConnected(): boolean {
    return RedisClient.instance?.status === 'ready';
  }
}

export const redis = RedisClient.getInstance();

export const connectRedis = () => RedisClient.connect();
export const disconnectRedis = () => RedisClient.disconnect();
export const isRedisConnected = () => RedisClient.isConnected();
export default redis;

// Graceful shutdown handlers (only in Node.js runtime)
process?.on?.call(null, 'SIGTERM', async () => {
  console.log('SIGTERM received, closing Redis connection...');
  await disconnectRedis();
});

process?.on?.call(null, 'SIGINT', async () => {
  console.log('SIGINT received, closing Redis connection...');
  await disconnectRedis();
});

