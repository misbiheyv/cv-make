import { NextResponse } from 'next/server';
import { browserPool } from '@/lib/browserPool';
import { pdfRateLimiter } from '@/lib/rateLimit';
import { isRedisConnected } from '@/lib/redis';

/**
 * Health check endpoint for monitoring
 * Returns system status, browser pool statistics, and rate limiter stats
 */
export async function GET() {
  try {
    const poolStats = browserPool.getStats();

    // Calculate pool utilization
    const poolUtilization = poolStats.total > 0
      ? ((poolStats.inUse / poolStats.total) * 100).toFixed(1)
      : '0.0';

    // Get rate limiter stats
    let rateLimitStats;
    let redisConnected = false;
    try {
      redisConnected = isRedisConnected();
      rateLimitStats = await pdfRateLimiter.getStats();
    } catch (error) {
      console.error('Failed to get rate limit stats:', error);
      rateLimitStats = { totalKeys: 0 };
    }

    // Determine health status
    const isHealthy =
      poolStats.total > 0 && // At least one browser available
      poolStats.inUse < poolStats.maxBrowsers && // Not at max capacity
      poolStats.waiting === 0 && // No requests waiting
      redisConnected; // Redis is connected

    const status = isHealthy ? 'healthy' : 'degraded';

    // Generate recommendations
    const recommendations: string[] = [];
    if (poolStats.waiting > 0) {
      recommendations.push(`${poolStats.waiting} requests waiting for browser`);
    }
    if (poolStats.inUse >= poolStats.maxBrowsers * 0.8) {
      recommendations.push('Browser pool utilization high (>80%)');
    }
    if (!redisConnected) {
      recommendations.push('Redis is not connected - rate limiting may not work');
    }
    if (recommendations.length === 0) {
      recommendations.push('System operating normally');
    }

    return NextResponse.json({
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
      browserPool: {
        ...poolStats,
        utilization: `${poolUtilization}%`,
      },
      rateLimit: {
        connected: redisConnected,
        trackedIdentifiers: rateLimitStats.totalKeys,
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '180000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10', 10),
      },
      recommendations,
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Failed to retrieve health status',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

