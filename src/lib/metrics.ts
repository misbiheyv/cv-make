import { Counter, collectDefaultMetrics, Gauge, Histogram, register } from 'prom-client';

// Collect Node.js default metrics (event loop lag, heap, GC, etc.)
collectDefaultMetrics({ register });

// --- HTTP Metrics ---

export const httpRequestsTotal = new Counter({
	name: 'http_requests_total',
	help: 'Total number of HTTP requests',
	labelNames: ['method', 'route', 'status'] as const,
});

export const httpRequestDuration = new Histogram({
	name: 'http_request_duration_seconds',
	help: 'HTTP request duration in seconds',
	labelNames: ['method', 'route', 'status'] as const,
	buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

// --- PDF Generation Metrics ---

export const pdfGenerationDuration = new Histogram({
	name: 'pdf_generation_duration_seconds',
	help: 'PDF generation duration in seconds',
	labelNames: ['status'] as const,
	buckets: [0.5, 1, 2, 3, 5, 10],
});

export const pdfGenerationTotal = new Counter({
	name: 'pdf_generation_total',
	help: 'Total number of PDF generation attempts',
	labelNames: ['status'] as const,
});

// --- Browser Pool Metrics ---

export const browserPoolSize = new Gauge({
	name: 'browser_pool_size',
	help: 'Current number of browsers in the pool',
	labelNames: ['state'] as const,
});

export const browserPoolQueueDepth = new Gauge({
	name: 'browser_pool_queue_depth',
	help: 'Number of requests waiting for a browser',
});

export const browserPoolOperationsTotal = new Counter({
	name: 'browser_pool_operations_total',
	help: 'Total browser pool operations',
	labelNames: ['operation'] as const,
});

export const browserPoolAcquireDuration = new Histogram({
	name: 'browser_pool_acquire_duration_seconds',
	help: 'Time spent waiting to acquire a browser',
	buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

export { register };
