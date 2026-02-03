import redis from './redis';

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}

interface RateLimitStats {
  totalKeys: number;
}

/**
 * Redis-based rate limiter using sliding window algorithm
 * 
 * Uses Redis Sorted Sets (ZSET) to track requests:
 * - Key: rate_limit:{identifier}
 * - Score: timestamp (for ordering and expiration)
 * - Member: unique request ID (timestamp string)
 * 
 * Algorithm:
 * 1. Remove old entries outside the time window
 * 2. Add current request
 * 3. Count total requests in window
 * 4. Check if under limit
 * 
 * Benefits:
 * - True sliding window (not fixed window)
 * - Atomic operations via Redis pipeline
 * - Automatic cleanup via EXPIRE
 * - Multi-server compatible
 */
export class RedisRateLimiter {
  private windowMs: number;
  private maxRequests: number;

  constructor(options: { windowMs: number; maxRequests: number }) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
  }

  /**
   * Check if request should be allowed
   * Returns rate limit status with remaining quota
   */
  async check(identifier: string): Promise<RateLimitResult> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.windowMs;

    try {
      // 1. Remove entries older than the time window
      // 2. Add current request with timestamp as score and member
      // 3. Count total requests in current window
      // 4. Set TTL to window duration (for automatic cleanup)
      const results = await redis
        .pipeline()
        .zremrangebyscore(key, 0, windowStart)
        .zadd(key, now, `${now}:${Math.random()}`)
        .zcard(key)
        .expire(key, Math.ceil(this.windowMs / 1000))
        .exec();

      if (!results) {
        throw new Error('Redis pipeline execution failed');
      }

      const [zcarError, zcardResult] = results[2];

      if (zcarError) {
        throw zcarError;
      }

      const count = zcardResult as number;
      const success = count <= this.maxRequests;
      const remaining = Math.max(0, this.maxRequests - count);
      const reset = new Date(now + this.windowMs);

      return {
        success,
        limit: this.maxRequests,
        remaining,
        reset,
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);

      // Fail-open strategy: Allow request if Redis is down
      // This prevents complete service outage if Redis fails
      // You can change this to fail-closed (deny request) if preferred
      const reset = new Date(now + this.windowMs);
      return {
        success: true, // Allow request on error
        limit: this.maxRequests,
        remaining: this.maxRequests,
        reset,
      };
    }
  }

  /**
   * Get statistics about current rate limiting state
   */
  async getStats(): Promise<RateLimitStats> {
    try {
      const keys = await redis.keys('rate_limit:*');

      return {
        totalKeys: keys.length,
      };
    } catch (error) {
      console.error('Failed to get rate limit stats:', error);
      return {
        totalKeys: 0,
      };
    }
  }

  /**
   * Manually reset rate limit for an identifier (admin function)
   */
  async reset(identifier: string): Promise<void> {
    const key = `rate_limit:${identifier}`;
    try {
      await redis.del(key);
      console.log(`Rate limit reset for: ${identifier}`);
    } catch (error) {
      console.error(`Failed to reset rate limit for ${identifier}:`, error);
      throw error;
    }
  }

  /**
   * Get current request count for an identifier
   */
  async getCount(identifier: string): Promise<number> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.windowMs;

    try {
      // Count requests in current window
      await redis.zremrangebyscore(key, 0, windowStart); // Clean up old entries
      const count = await redis.zcard(key);
      return count;
    } catch (error) {
      console.error('Failed to get request count:', error);
      return 0;
    }
  }
}

/**
 * PDF rate limiter instance
 */
export const pdfRateLimiter = new RedisRateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 10000),
  maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 1),
});
