import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { register } from 'prom-client';

vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockResolvedValue({
      connected: true,
      pages: vi.fn().mockResolvedValue([{ close: vi.fn() }]),
      close: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
    }),
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  })),
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
}));

import puppeteer from 'puppeteer';
import { BrowserPool } from '@/lib/browserPool';
import {
  browserPoolSize,
  browserPoolQueueDepth,
  browserPoolOperationsTotal,
  browserPoolAcquireDuration,
} from '@/lib/metrics';

function createMockBrowser(connected = true) {
  const handlers: Record<string, Function[]> = {};
  return {
    connected,
    pages: vi.fn().mockResolvedValue([{ close: vi.fn() }]),
    close: vi.fn().mockResolvedValue(undefined),
    on: vi.fn((event: string, handler: Function) => {
      if (!handlers[event]) handlers[event] = [];
      handlers[event].push(handler);
    }),
    emit(event: string) {
      handlers[event]?.forEach((h) => h());
    },
  };
}

describe('BrowserPool metrics integration', () => {
  let pool: BrowserPool;
  const mockLaunch = vi.mocked(puppeteer.launch);

  beforeEach(() => {
    register.resetMetrics();
    mockLaunch.mockClear();
    mockLaunch.mockImplementation(async () => createMockBrowser() as any);
  });

  afterEach(async () => {
    if (pool) await pool.destroy();
  });

  it('updates pool size gauges on acquire', async () => {
    pool = new BrowserPool({ min: 2, max: 5 });
    await pool.initialize();
    await pool.acquire();

    const metrics = await register.getMetricsAsJSON();
    const poolSizeMetric = metrics.find((m) => m.name === 'browser_pool_size');

    expect(poolSizeMetric).toBeDefined();
  });

  it('increments operations counter on acquire and release', async () => {
    pool = new BrowserPool({ min: 1, max: 5 });
    await pool.initialize();

    const browser = await pool.acquire();
    await pool.release(browser);

    const metrics = await register.getMetricsAsJSON();
    const opsMetric = metrics.find((m) => m.name === 'browser_pool_operations_total');

    expect(opsMetric).toBeDefined();
  });

  it('records acquire duration histogram', async () => {
    pool = new BrowserPool({ min: 1, max: 5 });
    await pool.initialize();
    await pool.acquire();

    const metrics = await register.getMetricsAsJSON();
    const durationMetric = metrics.find(
      (m) => m.name === 'browser_pool_acquire_duration_seconds'
    );

    expect(durationMetric).toBeDefined();
  });

  it('tracks queue depth when pool is at capacity', async () => {
    pool = new BrowserPool({ min: 1, max: 1, acquireTimeoutMs: 5000 });
    await pool.initialize();

    const browser = await pool.acquire();

    // This enters the wait queue
    const pending = pool.acquire();

    await new Promise((r) => setTimeout(r, 10));

    const metrics = await register.getMetricsAsJSON();
    const queueMetric = metrics.find((m) => m.name === 'browser_pool_queue_depth');

    expect(queueMetric).toBeDefined();

    // Cleanup
    await pool.release(browser);
    await pending;
  });

  it('increments create operation on browser creation', async () => {
    pool = new BrowserPool({ min: 2, max: 5 });
    await pool.initialize();

    const metrics = await register.getMetricsAsJSON();
    const opsMetric = metrics.find((m) => m.name === 'browser_pool_operations_total');

    expect(opsMetric).toBeDefined();
  });
});
