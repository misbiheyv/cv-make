# Browser Pool Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a comprehensive Vitest test suite for the BrowserPool class — unit tests with mocked Puppeteer for edge cases, integration tests against a Docker Compose stack for real-world validation, and performance benchmarks.

**Architecture:** Two test layers. Unit tests mock Puppeteer and exercise the BrowserPool class directly (initialization, acquire/release, concurrency, disconnects, destroy). Integration tests hit the running Docker stack via HTTP to verify PDF generation, pool behavior, and performance under load.

**Tech Stack:** Vitest, native fetch (Node 20), vi.mock for Puppeteer mocking

---

## File Structure

```
Modified:
  .gitignore                          — remove *.test.ts / docs/superpowers ignores
  package.json                        — add vitest, add test scripts
  src/lib/browserPool.ts              — add named export for BrowserPool class

Created:
  vitest.config.ts                    — alias config for @ → ./src
  tests/fixtures/test-data.ts         — valid resume data constant
  tests/helpers/http.ts               — shared fetch helpers for integration tests
  tests/unit/browser-pool.test.ts     — 18 unit tests with mocked Puppeteer
  tests/integration/browser-pool.test.ts — 7 integration tests against Docker stack
  tests/integration/performance.test.ts  — 5 performance benchmark tests
```

---

### Task 1: Test Infrastructure Setup

**Files:**
- Modify: `.gitignore`
- Modify: `package.json`
- Modify: `src/lib/browserPool.ts:13`
- Create: `vitest.config.ts`

- [ ] **Step 1: Update .gitignore to allow test files and docs**

Remove the lines that block test files and superpowers docs. In `.gitignore`, replace the `# testing` section and remove the `# ai` section:

```gitignore
# testing
/coverage
```

Remove these lines entirely:
- `*.test.ts`
- `*.test.tsx`
- `*.spec.ts`
- `*.spec.tsx`
- `/__tests__/`
- `/e2e/`
- `docs/superpowers`

Keep everything else unchanged.

- [ ] **Step 2: Install vitest**

Run: `npm install --save-dev vitest`

Expected: vitest added to devDependencies in package.json

- [ ] **Step 3: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 4: Add test scripts to package.json**

Add these scripts to the `"scripts"` section of `package.json`:

```json
"test": "vitest run tests/unit",
"test:integration": "vitest run tests/integration --test-timeout 30000",
"test:all": "vitest run tests --test-timeout 30000"
```

- [ ] **Step 5: Export BrowserPool class from source**

In `src/lib/browserPool.ts`, change line 13 from:

```typescript
class BrowserPool {
```

to:

```typescript
export class BrowserPool {
```

This adds a named export of the class alongside the existing `browserPool` singleton export.

- [ ] **Step 6: Verify setup**

Run: `npx vitest run tests/unit 2>&1 | head -20`

Expected: Vitest runs and reports "no test files found" (since we haven't created tests yet). No config errors.

- [ ] **Step 7: Commit**

```bash
git add .gitignore package.json package-lock.json vitest.config.ts src/lib/browserPool.ts
git commit -m "chore: set up vitest test infrastructure"
```

---

### Task 2: Test Fixtures & Helpers

**Files:**
- Create: `tests/fixtures/test-data.ts`
- Create: `tests/helpers/http.ts`

- [ ] **Step 1: Create test data fixture**

Create `tests/fixtures/test-data.ts`:

```typescript
export const VALID_RESUME_DATA = {
  personalInfo: {
    fullName: 'Jane Smith',
    links: [
      'jane.smith@example.com',
      '+1-555-0199',
      'https://linkedin.com/in/janesmith',
      'https://github.com/janesmith',
    ],
    summary:
      'Experienced full-stack developer with 8+ years of experience building scalable web applications.',
  },
  workExperience: [
    {
      id: 'exp1',
      title: 'Senior Full-Stack Developer',
      company: 'TechCorp Inc.',
      location: 'New York, NY',
      startDate: '2020-03',
      endDate: 'Present',
      bullets: [
        'Led development of microservices architecture serving 1M+ daily users',
        'Built real-time collaboration features using WebSocket and Redis',
      ],
    },
  ],
  education: [
    {
      id: 'edu1',
      degree: 'Bachelor of Science in Computer Science',
      institution: 'Massachusetts Institute of Technology',
      location: 'Cambridge, MA',
      startDate: '2012-09',
      endDate: '2016-06',
      description: 'Focus on distributed systems and algorithms.',
    },
  ],
  skills: ['JavaScript/TypeScript', 'React/Next.js', 'Node.js/Express'],
  languages: [
    { id: 'lang1', name: 'English', level: 'Native' },
    { id: 'lang2', name: 'Spanish', level: 'Intermediate' },
  ],
};

export const INVALID_RESUME_DATA = {
  personalInfo: { fullName: 123 },
};
```

- [ ] **Step 2: Create HTTP helper module**

Create `tests/helpers/http.ts`:

```typescript
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

export async function generatePdf(data: Record<string, unknown>): Promise<Response> {
  return fetch(`${BASE_URL}/api/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function getHealth(): Promise<Record<string, any>> {
  const res = await fetch(`${BASE_URL}/api/health`);
  return res.json();
}
```

- [ ] **Step 3: Commit**

```bash
git add tests/fixtures/test-data.ts tests/helpers/http.ts
git commit -m "test: add test fixtures and HTTP helpers"
```

---

### Task 3: Unit Tests — Initialization (Tests 1–3)

**Files:**
- Create: `tests/unit/browser-pool.test.ts`

- [ ] **Step 1: Create unit test file with mock setup and initialization tests**

Create `tests/unit/browser-pool.test.ts`:

```typescript
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
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test`

Expected: 3 tests pass (creates min browsers, handles partial failure, double init idempotent).

- [ ] **Step 3: Commit**

```bash
git add tests/unit/browser-pool.test.ts
git commit -m "test: add browser pool initialization unit tests"
```

---

### Task 4: Unit Tests — Acquire/Release (Tests 4–8)

**Files:**
- Modify: `tests/unit/browser-pool.test.ts`

- [ ] **Step 1: Add acquire/release describe block**

Add the following `describe` block inside the outer `describe('BrowserPool', ...)`, after the `initialization` block:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test`

Expected: 8 tests pass (3 initialization + 5 acquire/release).

- [ ] **Step 3: Commit**

```bash
git add tests/unit/browser-pool.test.ts
git commit -m "test: add browser pool acquire/release unit tests"
```

---

### Task 5: Unit Tests — Concurrency & Pool Limits (Tests 9–11)

**Files:**
- Modify: `tests/unit/browser-pool.test.ts`

- [ ] **Step 1: Add concurrency describe block**

Add the following `describe` block inside the outer `describe('BrowserPool', ...)`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test`

Expected: 11 tests pass (3 + 5 + 3).

- [ ] **Step 3: Commit**

```bash
git add tests/unit/browser-pool.test.ts
git commit -m "test: add browser pool concurrency and limits unit tests"
```

---

### Task 6: Unit Tests — Disconnected Browser Handling (Tests 12–14)

**Files:**
- Modify: `tests/unit/browser-pool.test.ts`

- [ ] **Step 1: Add disconnected browser describe block**

Add the following `describe` block inside the outer `describe('BrowserPool', ...)`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test`

Expected: 14 tests pass (3 + 5 + 3 + 3).

- [ ] **Step 3: Commit**

```bash
git add tests/unit/browser-pool.test.ts
git commit -m "test: add browser pool disconnect handling unit tests"
```

---

### Task 7: Unit Tests — Destroy & Stats (Tests 15–18)

**Files:**
- Modify: `tests/unit/browser-pool.test.ts`

- [ ] **Step 1: Add destroy and stats describe blocks**

Add the following `describe` blocks inside the outer `describe('BrowserPool', ...)`:

```typescript
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
```

- [ ] **Step 2: Run all unit tests to verify they pass**

Run: `npm test`

Expected: 18 tests pass. All unit test suites green.

- [ ] **Step 3: Commit**

```bash
git add tests/unit/browser-pool.test.ts
git commit -m "test: add browser pool destroy and stats unit tests"
```

---

### Task 8: Integration Tests — Browser Pool (Tests 1–7)

**Prerequisites:** Docker Compose stack running (`docker compose up -d`). App healthy at `http://localhost:3000/api/health`.

**Files:**
- Create: `tests/integration/browser-pool.test.ts`

- [ ] **Step 1: Create integration test file**

Create `tests/integration/browser-pool.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { generatePdf, getHealth } from '../helpers/http';
import { VALID_RESUME_DATA, INVALID_RESUME_DATA } from '../fixtures/test-data';

describe('Browser Pool Integration', () => {
  describe('health endpoint', () => {
    it('returns pool stats with expected fields', async () => {
      const health = await getHealth();

      expect(health.status).toBeDefined();
      expect(health.browserPool).toBeDefined();
      expect(health.browserPool).toMatchObject({
        total: expect.any(Number),
        available: expect.any(Number),
        inUse: expect.any(Number),
        waiting: expect.any(Number),
        maxBrowsers: expect.any(Number),
        utilization: expect.stringMatching(/^\d+\.\d+%$/),
      });
    });
  });

  describe('PDF generation', () => {
    it('generates a PDF from valid resume data', async () => {
      const res = await generatePdf(VALID_RESUME_DATA);

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe('application/pdf');
      expect(res.headers.get('x-generation-time')).toMatch(/^\d+ms$/);

      const body = await res.arrayBuffer();
      expect(body.byteLength).toBeGreaterThan(0);
    });

    it('reuses browsers across sequential requests', async () => {
      const healthBefore = await getHealth();
      const initialTotal = healthBefore.browserPool.total;

      // Three sequential PDF generations
      for (let i = 0; i < 3; i++) {
        const res = await generatePdf(VALID_RESUME_DATA);
        expect(res.status).toBe(200);
      }

      const healthAfter = await getHealth();

      // Pool total should be stable (not growing unboundedly)
      expect(healthAfter.browserPool.total).toBeLessThanOrEqual(initialTotal + 1);
    });

    it('handles concurrent requests successfully', async () => {
      const requests = Array.from({ length: 5 }, () =>
        generatePdf(VALID_RESUME_DATA),
      );

      const responses = await Promise.all(requests);

      responses.forEach((res) => {
        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toBe('application/pdf');
      });
    });

    it('returns 400 for invalid data without impacting pool', async () => {
      const healthBefore = await getHealth();

      const res = await generatePdf(INVALID_RESUME_DATA);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid resume data');

      const healthAfter = await getHealth();
      expect(healthAfter.browserPool.total).toBe(healthBefore.browserPool.total);
    });
  });

  describe('pool lifecycle', () => {
    it('shows in-use browsers during concurrent load', async () => {
      // Fire off requests but DON'T await them yet
      const requests = Array.from({ length: 5 }, () =>
        generatePdf(VALID_RESUME_DATA),
      );

      // Check health while requests are in-flight
      // Small delay to ensure requests have started
      await new Promise((r) => setTimeout(r, 200));
      const healthDuring = await getHealth();

      expect(healthDuring.browserPool.inUse).toBeGreaterThan(0);

      // Now await all requests to complete
      await Promise.all(requests);
    });

    it('returns all browsers to pool after requests complete', async () => {
      // Generate several PDFs
      const requests = Array.from({ length: 3 }, () =>
        generatePdf(VALID_RESUME_DATA),
      );
      await Promise.all(requests);

      // Small delay for release to propagate
      await new Promise((r) => setTimeout(r, 500));

      const health = await getHealth();

      expect(health.browserPool.inUse).toBe(0);
      expect(health.browserPool.available).toBe(health.browserPool.total);
    });
  });
});
```

- [ ] **Step 2: Run integration tests**

Make sure Docker stack is running, then run:

```bash
npm run test:integration
```

Expected: 7 tests pass. All integration tests green.

- [ ] **Step 3: Commit**

```bash
git add tests/integration/browser-pool.test.ts
git commit -m "test: add browser pool integration tests"
```

---

### Task 9: Performance Benchmarks (Tests 1–5)

**Prerequisites:** Docker Compose stack running (`docker compose up -d`).

**Files:**
- Create: `tests/integration/performance.test.ts`

- [ ] **Step 1: Create performance benchmark test file**

Create `tests/integration/performance.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { generatePdf, getHealth } from '../helpers/http';
import { VALID_RESUME_DATA } from '../fixtures/test-data';

function percentile(sorted: number[], p: number): number {
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function formatMs(ms: number): string {
  return `${Math.round(ms)}ms`;
}

function printTable(label: string, durations: number[]) {
  const sorted = [...durations].sort((a, b) => a - b);
  const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
  const p95 = percentile(sorted, 95);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  console.log(`\n  ${label}:`);
  console.log(`    Requests: ${durations.length}`);
  console.log(`    Mean:     ${formatMs(mean)}`);
  console.log(`    P95:      ${formatMs(p95)}`);
  console.log(`    Min:      ${formatMs(min)}`);
  console.log(`    Max:      ${formatMs(max)}`);
}

async function timedPdf(): Promise<{ duration: number; status: number }> {
  const start = performance.now();
  const res = await generatePdf(VALID_RESUME_DATA);
  const duration = performance.now() - start;
  return { duration, status: res.status };
}

describe('Performance Benchmarks', () => {
  it('cold start responds under 5 seconds', async () => {
    const { duration, status } = await timedPdf();

    console.log(`\n  Cold start: ${formatMs(duration)}`);

    expect(status).toBe(200);
    expect(duration).toBeLessThan(5000);
  });

  it('warm request responds under 3 seconds', async () => {
    // Warmup request
    await timedPdf();

    // Measured request
    const { duration, status } = await timedPdf();

    console.log(`\n  Warm request: ${formatMs(duration)}`);

    expect(status).toBe(200);
    expect(duration).toBeLessThan(3000);
  });

  it('sequential throughput over 10 requests', async () => {
    // Warmup
    await timedPdf();

    const durations: number[] = [];
    for (let i = 0; i < 10; i++) {
      const { duration, status } = await timedPdf();
      expect(status).toBe(200);
      durations.push(duration);
    }

    printTable('Sequential throughput (10 requests)', durations);
  });

  it('concurrent throughput with 10 simultaneous requests', async () => {
    // Warmup
    await timedPdf();

    const totalStart = performance.now();

    const results = await Promise.all(
      Array.from({ length: 10 }, () => timedPdf()),
    );

    const totalElapsed = performance.now() - totalStart;
    const durations = results.map((r) => r.duration);

    results.forEach((r) => {
      expect(r.status).toBe(200);
    });

    printTable('Concurrent throughput (10 simultaneous)', durations);
    console.log(`    Total wall time: ${formatMs(totalElapsed)}`);
  });

  it('pool scales under heavy concurrent load (15 requests)', async () => {
    // Warmup
    await timedPdf();

    const healthBefore = await getHealth();
    const totalStart = performance.now();

    const results = await Promise.all(
      Array.from({ length: 15 }, () => timedPdf()),
    );

    const totalElapsed = performance.now() - totalStart;
    const durations = results.map((r) => r.duration);

    const healthAfter = await getHealth();

    results.forEach((r) => {
      expect(r.status).toBe(200);
    });

    printTable('Heavy load (15 simultaneous)', durations);
    console.log(`    Total wall time: ${formatMs(totalElapsed)}`);
    console.log(`    Pool before: total=${healthBefore.browserPool.total}, max=${healthBefore.browserPool.maxBrowsers}`);
    console.log(`    Pool after:  total=${healthAfter.browserPool.total}, max=${healthAfter.browserPool.maxBrowsers}`);
  });
});
```

- [ ] **Step 2: Run performance benchmarks**

```bash
npm run test:integration
```

Expected: 5 performance tests pass. Timing results printed to console. Cold start < 5s, warm < 3s, all concurrent requests succeed.

- [ ] **Step 3: Commit**

```bash
git add tests/integration/performance.test.ts
git commit -m "test: add browser pool performance benchmarks"
```

---

### Task 10: Final Verification

- [ ] **Step 1: Run full unit test suite**

Run: `npm test`

Expected: 18 unit tests pass.

- [ ] **Step 2: Run full integration suite (if Docker stack available)**

Run: `npm run test:integration`

Expected: 12 integration tests pass (7 pool + 5 performance).

- [ ] **Step 3: Run all tests together**

Run: `npm run test:all`

Expected: 30 total tests pass.
