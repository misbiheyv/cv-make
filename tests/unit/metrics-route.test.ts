import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('prom-client', () => {
  const mockRegister = {
    metrics: vi.fn().mockResolvedValue('# HELP http_requests_total Total\nhttp_requests_total 0'),
    contentType: 'text/plain; version=0.0.4; charset=utf-8',
    resetMetrics: vi.fn(),
  };
  return {
    register: mockRegister,
    Counter: vi.fn().mockImplementation(function () { return { inc: vi.fn(), name: '' }; }),
    Histogram: vi.fn().mockImplementation(function () { return { startTimer: vi.fn(), name: '' }; }),
    Gauge: vi.fn().mockImplementation(function () { return { set: vi.fn(), name: '' }; }),
    collectDefaultMetrics: vi.fn(),
  };
});

import { GET } from '@/app/api/metrics/route';
import { register } from 'prom-client';

describe('GET /api/metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns metrics in prometheus text format', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/plain; version=0.0.4; charset=utf-8');

    const body = await response.text();
    expect(body).toContain('http_requests_total');
  });

  it('returns 500 if metrics collection fails', async () => {
    vi.mocked(register.metrics).mockRejectedValueOnce(new Error('metrics failed'));

    const response = await GET();

    expect(response.status).toBe(500);
  });
});
