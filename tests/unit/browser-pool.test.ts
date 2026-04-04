import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

import puppeteer from 'puppeteer';
import { BrowserPool } from '@/lib/browserPool';

type MockBrowser = {
  connected: boolean;
  pages: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  newPage: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  emit: (event: string) => void;
};

function createMockBrowser(connected = true): MockBrowser {
  const handlers: Record<string, Function[]> = {};
  return {
    connected,
    pages: vi.fn().mockResolvedValue([{ close: vi.fn() }]),
    close: vi.fn().mockResolvedValue(undefined),
    newPage: vi.fn().mockResolvedValue({ close: vi.fn() }),
    on: vi.fn((event: string, handler: Function) => {
      if (!handlers[event]) handlers[event] = [];
      handlers[event].push(handler);
    }),
    emit(event: string) {
      handlers[event]?.forEach((h) => h());
    },
  };
}

describe('BrowserPool', () => {
  let pool: BrowserPool;
  const mockLaunch = vi.mocked(puppeteer.launch);

  beforeEach(() => {
    mockLaunch.mockClear();
    mockLaunch.mockImplementation(async () => createMockBrowser() as any);
  });

  afterEach(async () => {
    if (pool) await pool.destroy();
  });

  // === INITIALIZATION (Tests 1-3) ===

  describe('initialization', () => {
    it('creates min browsers on initialize', async () => {
      pool = new BrowserPool({ min: 3, max: 5 });
      await pool.initialize();

      expect(mockLaunch).toHaveBeenCalledTimes(3);
      expect(pool.getStats().total).toBe(3);
      expect(pool.getStats().available).toBe(3);
    });

    it('handles partial initialization failure', async () => {
      let callCount = 0;
      mockLaunch.mockImplementation(async () => {
        callCount++;
        if (callCount === 2) throw new Error('Launch failed');
        return createMockBrowser() as any;
      });

      pool = new BrowserPool({ min: 3, max: 5 });
      await pool.initialize();

      expect(pool.getStats().total).toBe(2);
      expect(pool.getStats().available).toBe(2);
    });

    it('double initialize is idempotent', async () => {
      pool = new BrowserPool({ min: 2, max: 5 });

      await Promise.all([pool.initialize(), pool.initialize()]);

      expect(mockLaunch).toHaveBeenCalledTimes(2);
      expect(pool.getStats().total).toBe(2);
    });
  });

  // === ACQUIRE AND RELEASE (Tests 4-8) ===

  describe('acquire and release', () => {
    it('acquire returns an available browser', async () => {
      pool = new BrowserPool({ min: 1, max: 5 });
      await pool.initialize();

      const browser = await pool.acquire();

      expect(browser).toBeDefined();
      expect(pool.getStats().available).toBe(0);
      expect(pool.getStats().inUse).toBe(1);
    });

    it('acquire auto-initializes if not initialized', async () => {
      pool = new BrowserPool({ min: 1, max: 5 });

      const browser = await pool.acquire();

      expect(browser).toBeDefined();
      expect(mockLaunch).toHaveBeenCalled();
    });

    it('release returns browser to available pool', async () => {
      pool = new BrowserPool({ min: 1, max: 5 });
      await pool.initialize();
      const browser = await pool.acquire();

      expect(pool.getStats().available).toBe(0);

      await pool.release(browser);

      expect(pool.getStats().available).toBe(1);
      expect(pool.getStats().inUse).toBe(0);
    });

    it('release closes extra pages', async () => {
      pool = new BrowserPool({ min: 1, max: 5 });
      await pool.initialize();
      const browser = await pool.acquire();

      const page1 = { close: vi.fn().mockResolvedValue(undefined) };
      const page2 = { close: vi.fn().mockResolvedValue(undefined) };
      const page3 = { close: vi.fn().mockResolvedValue(undefined) };
      (browser as any).pages.mockResolvedValue([page1, page2, page3]);

      await pool.release(browser);

      expect(page1.close).not.toHaveBeenCalled();
      expect(page2.close).toHaveBeenCalled();
      expect(page3.close).toHaveBeenCalled();
    });

    it('release prioritizes wait queue over available pool', async () => {
      pool = new BrowserPool({ min: 1, max: 1, idleTimeoutMs: 5000 });
      await pool.initialize();

      const browser1 = await pool.acquire();

      // This enters the wait queue (pool at max capacity)
      const acquirePromise = pool.acquire();

      // Release browser1 — should go to waiter, not available pool
      await pool.release(browser1);

      const browser2 = await acquirePromise;

      expect(browser2).toBe(browser1);
      expect(pool.getStats().available).toBe(0);
      expect(pool.getStats().waiting).toBe(0);
    });
  });

  // === CONCURRENCY AND POOL LIMITS (Tests 9-11) ===

  describe('concurrency and pool limits', () => {
    it('creates new browser when none available but under max', async () => {
      pool = new BrowserPool({ min: 1, max: 3 });
      await pool.initialize();

      expect(mockLaunch).toHaveBeenCalledTimes(1);

      // Acquire the one available browser
      await pool.acquire();
      // Acquire again — should create a new browser
      await pool.acquire();

      expect(mockLaunch).toHaveBeenCalledTimes(2);
      expect(pool.getStats().total).toBe(2);
    });

    it('queues when at max capacity', async () => {
      const browsers = [createMockBrowser(), createMockBrowser()];
      let idx = 0;
      mockLaunch.mockImplementation(async () => browsers[idx++] as any);

      pool = new BrowserPool({ min: 1, max: 2, idleTimeoutMs: 5000 });
      await pool.initialize();

      await pool.acquire();
      await pool.acquire();

      // Third acquire should queue since max=2
      let resolved = false;
      const pending = pool.acquire().then((b) => {
        resolved = true;
        return b;
      });

      // Allow microtasks to flush
      await new Promise((r) => setTimeout(r, 10));

      expect(resolved).toBe(false);
      expect(pool.getStats().waiting).toBe(1);

      // Cleanup: release one to unblock, then destroy
      await pool.release(browsers[0] as any);
      await pending;
    });

    it('wait queue timeout rejects with error', async () => {
      pool = new BrowserPool({ min: 1, max: 1, idleTimeoutMs: 50 });
      await pool.initialize();

      // Acquire the only browser
      await pool.acquire();

      // This will queue and then timeout after 50ms
      await expect(pool.acquire()).rejects.toThrow('Browser acquisition timeout');
    });
  });

  // === DISCONNECTED BROWSER HANDLING (Tests 12-14) ===

  describe('disconnected browser handling', () => {
    it('acquire skips disconnected browser and creates a new one', async () => {
      const disconnectedBrowser = createMockBrowser(false);
      const freshBrowser = createMockBrowser(true);

      let callCount = 0;
      mockLaunch.mockImplementation(async () => {
        callCount++;
        // First call (during init) returns the browser that will disconnect
        if (callCount === 1) return disconnectedBrowser as any;
        // Second call (replacement) returns fresh browser
        return freshBrowser as any;
      });

      pool = new BrowserPool({ min: 1, max: 5 });
      await pool.initialize();

      // The available browser has connected=false, so acquire should skip it
      // and create a new one
      const browser = await pool.acquire();

      expect(browser).toBe(freshBrowser);
      expect(mockLaunch).toHaveBeenCalledTimes(2);
    });

    it('disconnected event removes browser from pool', async () => {
      const mockBrowser = createMockBrowser();
      mockLaunch.mockResolvedValue(mockBrowser as any);

      pool = new BrowserPool({ min: 1, max: 5 });
      await pool.initialize();

      expect(pool.getStats().total).toBe(1);

      // Simulate disconnect
      mockBrowser.connected = false;
      mockBrowser.emit('disconnected');

      expect(pool.getStats().total).toBe(0);
      expect(pool.getStats().available).toBe(0);
    });

    it('release of disconnected browser removes it from pool', async () => {
      pool = new BrowserPool({ min: 1, max: 5 });
      await pool.initialize();

      const browser = await pool.acquire();
      (browser as any).connected = false;

      await pool.release(browser);

      expect(pool.getStats().total).toBe(0);
      expect(pool.getStats().available).toBe(0);
    });
  });

  // === DESTROY (Tests 15-17) ===

  describe('destroy', () => {
    it('closes all browsers', async () => {
      const browsers = [createMockBrowser(), createMockBrowser(), createMockBrowser()];
      let idx = 0;
      mockLaunch.mockImplementation(async () => browsers[idx++] as any);

      pool = new BrowserPool({ min: 3, max: 5 });
      await pool.initialize();

      await pool.destroy();

      browsers.forEach((b) => {
        expect(b.close).toHaveBeenCalled();
      });
    });

    it('clears wait queue on destroy', async () => {
      pool = new BrowserPool({ min: 1, max: 1, idleTimeoutMs: 5000 });
      await pool.initialize();

      await pool.acquire();

      // This enters the wait queue
      const pending = pool.acquire();
      pending.catch(() => {}); // suppress unhandled rejection

      await new Promise((r) => setTimeout(r, 0));
      expect(pool.getStats().waiting).toBe(1);

      await pool.destroy();

      expect(pool.getStats().waiting).toBe(0);
    });

    it('resets state after destroy', async () => {
      pool = new BrowserPool({ min: 2, max: 5 });
      await pool.initialize();

      expect(pool.getStats().total).toBe(2);

      await pool.destroy();

      const stats = pool.getStats();
      expect(stats.total).toBe(0);
      expect(stats.available).toBe(0);
      expect(stats.inUse).toBe(0);
      expect(stats.waiting).toBe(0);
    });
  });

  // === STATS (Test 18) ===

  describe('getStats', () => {
    it('reflects accurate counts through acquire/release lifecycle', async () => {
      const browsers = [createMockBrowser(), createMockBrowser(), createMockBrowser()];
      let idx = 0;
      mockLaunch.mockImplementation(async () => browsers[idx++] as any);

      pool = new BrowserPool({ min: 2, max: 3 });
      await pool.initialize();

      // After init: 2 total, 2 available, 0 in use
      expect(pool.getStats()).toMatchObject({
        total: 2,
        available: 2,
        inUse: 0,
        waiting: 0,
        maxBrowsers: 3,
      });

      // Acquire one
      const b1 = await pool.acquire();
      expect(pool.getStats()).toMatchObject({
        total: 2,
        available: 1,
        inUse: 1,
      });

      // Acquire second
      const b2 = await pool.acquire();
      expect(pool.getStats()).toMatchObject({
        total: 2,
        available: 0,
        inUse: 2,
      });

      // Acquire third — creates new browser (under max)
      const b3 = await pool.acquire();
      expect(pool.getStats()).toMatchObject({
        total: 3,
        available: 0,
        inUse: 3,
      });

      // Release one
      await pool.release(b1);
      expect(pool.getStats()).toMatchObject({
        total: 3,
        available: 1,
        inUse: 2,
      });

      // Release remaining
      await pool.release(b2);
      await pool.release(b3);
      expect(pool.getStats()).toMatchObject({
        total: 3,
        available: 3,
        inUse: 0,
      });
    });
  });
});
