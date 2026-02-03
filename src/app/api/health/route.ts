import { NextResponse } from 'next/server';
import { browserPool } from '@/lib/browserPool';

/**
 * Health check endpoint for monitoring
 * Returns system status and pool statistics
 */
export async function GET() {
  try {
    const poolStats = browserPool.getStats();

    // Calculate pool utilization
    const poolUtilization = poolStats.total > 0
      ? ((poolStats.inUse / poolStats.total) * 100).toFixed(1)
      : '0.0';

    // Determine health status
    const isHealthy =
      poolStats.total > 0 && // At least one browser available
      poolStats.inUse < poolStats.maxBrowsers && // Not at max capacity
      poolStats.waiting === 0; // No requests waiting

    const status = isHealthy ? 'healthy' : 'degraded';

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

