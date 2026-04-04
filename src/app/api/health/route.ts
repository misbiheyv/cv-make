import { NextResponse } from 'next/server';
import { browserPool } from '@/lib/browserPool';
import { createLogger } from '@/lib/logger';

const log = createLogger('health');

/**
 * Health check endpoint for monitoring
 * Returns system status and browser pool statistics
 */
export async function GET() {
	try {
		const poolStats = browserPool.getStats();

		const poolUtilization =
			poolStats.total > 0 ? ((poolStats.inUse / poolStats.total) * 100).toFixed(1) : '0.0';

		const isHealthy =
			poolStats.total > 0 && poolStats.inUse < poolStats.maxBrowsers && poolStats.waiting === 0;

		const status = isHealthy ? 'healthy' : 'degraded';

		const recommendations: string[] = [];
		if (poolStats.waiting > 0) {
			recommendations.push(`${poolStats.waiting} requests waiting for browser`);
		}
		if (poolStats.inUse >= poolStats.maxBrowsers * 0.8) {
			recommendations.push('Browser pool utilization high (>80%)');
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
			recommendations,
		});
	} catch (error) {
		log.error({ error }, 'Health check failed');
		return NextResponse.json(
			{
				status: 'unhealthy',
				error: 'Failed to retrieve health status',
				timestamp: new Date().toISOString(),
			},
			{ status: 503 },
		);
	}
}
