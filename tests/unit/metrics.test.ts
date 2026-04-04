import { describe, it, expect, beforeEach } from 'vitest';
import { register } from 'prom-client';
import {
  httpRequestsTotal,
  httpRequestDuration,
  pdfGenerationDuration,
  pdfGenerationTotal,
  browserPoolSize,
  browserPoolQueueDepth,
  browserPoolOperationsTotal,
  browserPoolAcquireDuration,
} from '@/lib/metrics';

describe('metrics', () => {
  beforeEach(() => {
    register.resetMetrics();
  });

  it('httpRequestsTotal is a counter with correct labels', () => {
    httpRequestsTotal.inc({ method: 'POST', route: '/api/pdf', status: '200' });

    expect(httpRequestsTotal.name).toBe('http_requests_total');
  });

  it('httpRequestDuration is a histogram with correct labels', () => {
    const end = httpRequestDuration.startTimer({ method: 'POST', route: '/api/pdf' });
    end({ status: '200' });

    expect(httpRequestDuration.name).toBe('http_request_duration_seconds');
  });

  it('pdfGenerationDuration is a histogram', () => {
    const end = pdfGenerationDuration.startTimer();
    end({ status: 'success' });

    expect(pdfGenerationDuration.name).toBe('pdf_generation_duration_seconds');
  });

  it('pdfGenerationTotal is a counter', () => {
    pdfGenerationTotal.inc({ status: 'success' });

    expect(pdfGenerationTotal.name).toBe('pdf_generation_total');
  });

  it('browserPoolSize is a gauge with state label', () => {
    browserPoolSize.set({ state: 'available' }, 3);
    browserPoolSize.set({ state: 'in_use' }, 1);

    expect(browserPoolSize.name).toBe('browser_pool_size');
  });

  it('browserPoolQueueDepth is a gauge', () => {
    browserPoolQueueDepth.set(2);

    expect(browserPoolQueueDepth.name).toBe('browser_pool_queue_depth');
  });

  it('browserPoolOperationsTotal is a counter with operation label', () => {
    browserPoolOperationsTotal.inc({ operation: 'acquire' });

    expect(browserPoolOperationsTotal.name).toBe('browser_pool_operations_total');
  });

  it('browserPoolAcquireDuration is a histogram', () => {
    const end = browserPoolAcquireDuration.startTimer();
    end();

    expect(browserPoolAcquireDuration.name).toBe('browser_pool_acquire_duration_seconds');
  });

  it('all metrics are registered in the default registry', async () => {
    const metrics = await register.getMetricsAsJSON();
    const names = metrics.map((m) => m.name);

    expect(names).toContain('http_requests_total');
    expect(names).toContain('http_request_duration_seconds');
    expect(names).toContain('pdf_generation_duration_seconds');
    expect(names).toContain('pdf_generation_total');
    expect(names).toContain('browser_pool_size');
    expect(names).toContain('browser_pool_queue_depth');
    expect(names).toContain('browser_pool_operations_total');
    expect(names).toContain('browser_pool_acquire_duration_seconds');
  });
});
