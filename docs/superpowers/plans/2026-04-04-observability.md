# Observability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add structured logging (pino), Prometheus metrics (prom-client), and a self-contained monitoring stack (Prometheus + Grafana) to the resume builder.

**Architecture:** A `src/lib/logger.ts` module provides structured JSON logging with request ID correlation. A `src/lib/metrics.ts` module defines all Prometheus metrics. Both are imported by existing route handlers and the browser pool. Prometheus, Grafana, and an Nginx exporter run as Docker Compose services alongside the app.

**Tech Stack:** pino (logging), prom-client (metrics), Prometheus, Grafana, nginx-prometheus-exporter

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install prom-client and pino**

Run: `npm install prom-client pino`

- [ ] **Step 2: Verify installation**

Run: `node -e "require('prom-client'); require('pino'); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add prom-client and pino dependencies"
```

---

### Task 2: Create Logger Module

**Files:**
- Create: `src/lib/logger.ts`
- Test: `tests/unit/logger.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/logger.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('pino', () => {
  const childFn = vi.fn().mockReturnThis();
  const logger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: childFn,
  };
  return { default: vi.fn(() => logger) };
});

import pino from 'pino';
import { createLogger, logger } from '@/lib/logger';

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports a default logger instance', () => {
    expect(logger).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.debug).toBeDefined();
  });

  it('createLogger returns a child logger with component field', () => {
    const child = createLogger('browserPool');

    expect(logger.child).toHaveBeenCalledWith({ component: 'browserPool' });
  });

  it('createLogger with requestId includes it in child context', () => {
    const child = createLogger('pdf', 'req-123');

    expect(logger.child).toHaveBeenCalledWith({
      component: 'pdf',
      requestId: 'req-123',
    });
  });

  it('pino is initialized with correct base config', () => {
    expect(pino).toHaveBeenCalledWith(
      expect.objectContaining({
        level: expect.any(String),
        base: expect.objectContaining({
          service: 'resume-builder',
        }),
      })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/logger.test.ts`
Expected: FAIL — `Cannot find module '@/lib/logger'`

- [ ] **Step 3: Write the implementation**

Create `src/lib/logger.ts`:

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  base: {
    service: 'resume-builder',
    env: process.env.NODE_ENV ?? 'development',
  },
});

export function createLogger(component: string, requestId?: string) {
  const context: Record<string, string> = { component };

  if (requestId) {
    context.requestId = requestId;
  }

  return logger.child(context);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/logger.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/logger.ts tests/unit/logger.test.ts
git commit -m "feat: add structured logging module with pino"
```

---

### Task 3: Create Metrics Module

**Files:**
- Create: `src/lib/metrics.ts`
- Test: `tests/unit/metrics.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/metrics.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/metrics.test.ts`
Expected: FAIL — `Cannot find module '@/lib/metrics'`

- [ ] **Step 3: Write the implementation**

Create `src/lib/metrics.ts`:

```typescript
import { Counter, Histogram, Gauge, collectDefaultMetrics, register } from 'prom-client';

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/metrics.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/metrics.ts tests/unit/metrics.test.ts
git commit -m "feat: add Prometheus metrics module with prom-client"
```

---

### Task 4: Create /metrics Endpoint

**Files:**
- Create: `src/app/api/metrics/route.ts`
- Test: `tests/unit/metrics-route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/metrics-route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('prom-client', () => {
  const mockRegister = {
    metrics: vi.fn().mockResolvedValue('# HELP http_requests_total Total\nhttp_requests_total 0'),
    contentType: 'text/plain; version=0.0.4; charset=utf-8',
    resetMetrics: vi.fn(),
  };
  return {
    register: mockRegister,
    Counter: vi.fn().mockImplementation(() => ({ inc: vi.fn(), name: '' })),
    Histogram: vi.fn().mockImplementation(() => ({ startTimer: vi.fn(), name: '' })),
    Gauge: vi.fn().mockImplementation(() => ({ set: vi.fn(), name: '' })),
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/metrics-route.test.ts`
Expected: FAIL — `Cannot find module '@/app/api/metrics/route'`

- [ ] **Step 3: Write the implementation**

Create `src/app/api/metrics/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { register } from '@/lib/metrics';

export async function GET() {
  try {
    const metrics = await register.metrics();

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': register.contentType,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/metrics-route.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/metrics/route.ts tests/unit/metrics-route.test.ts
git commit -m "feat: add /api/metrics endpoint for Prometheus scraping"
```

---

### Task 5: Integrate Logger into Browser Pool

**Files:**
- Modify: `src/lib/browserPool.ts`

Replace all `console.*` calls with the structured pino logger. No behavioral changes — just logging method swaps.

- [ ] **Step 1: Run existing browser pool tests to confirm they pass before changes**

Run: `npx vitest run tests/unit/browser-pool.test.ts`
Expected: PASS (18 tests)

- [ ] **Step 2: Replace console calls with pino logger**

In `src/lib/browserPool.ts`, add the import at the top (after the puppeteer import):

```typescript
import { createLogger } from '@/lib/logger';

const log = createLogger('browserPool');
```

Then replace each console call:

| Line | Old | New |
|------|-----|-----|
| 36 | `console.log(\`Initializing browser pool with ${this.minBrowsers} browsers...\`)` | `log.info({ minBrowsers: this.minBrowsers }, 'Initializing browser pool')` |
| 47 | `return console.error('Failed to initialize browser:', browser.reason)` | `log.error({ error: browser.reason }, 'Failed to initialize browser'); return` |
| 55 | `console.log(\`Browser pool initialized with ${this.browsers.length} browsers\`)` | `log.info({ totalBrowsers: this.browsers.length }, 'Browser pool initialized')` |
| 65 | `console.log('Destroying browser pool...')` | `log.info('Destroying browser pool')` |
| 76 | `console.error('Error closing browser:', err)` | `log.error({ error: err }, 'Error closing browser')` |
| 84 | `console.log('Browser pool destroyed')` | `log.info('Browser pool destroyed')` |
| 177 | `console.warn('Browser disconnected, removing from pool')` | `log.warn('Browser disconnected, removing from pool')` |
| 216 | `console.log(\`Closing idle browser (pool: ${this.browsers.length} → ${this.browsers.length - 1})\`)` | `log.info({ poolSize: this.browsers.length, newPoolSize: this.browsers.length - 1 }, 'Closing idle browser')` |
| 261 | `console.error('Failed to initialize browser pool:', err)` | `log.error({ error: err }, 'Failed to initialize browser pool')` |

- [ ] **Step 3: Run existing tests to confirm no regressions**

Run: `npx vitest run tests/unit/browser-pool.test.ts`
Expected: PASS (18 tests). Tests mock puppeteer but don't assert on console, so they should all still pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/browserPool.ts
git commit -m "refactor: replace console logging with pino in browser pool"
```

---

### Task 6: Integrate Metrics into Browser Pool

**Files:**
- Modify: `src/lib/browserPool.ts`
- Test: `tests/unit/browser-pool-metrics.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/browser-pool-metrics.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/browser-pool-metrics.test.ts`
Expected: FAIL — metrics not being recorded by BrowserPool yet

- [ ] **Step 3: Add metrics instrumentation to BrowserPool**

In `src/lib/browserPool.ts`, add the metrics import (after the logger import):

```typescript
import {
  browserPoolSize,
  browserPoolQueueDepth,
  browserPoolOperationsTotal,
  browserPoolAcquireDuration,
} from '@/lib/metrics';
```

Add a private method to update gauge metrics:

```typescript
private updatePoolGauges(): void {
  browserPoolSize.set({ state: 'available' }, this.available.length);
  browserPoolSize.set({ state: 'in_use' }, this.browsers.length - this.available.length);
  browserPoolQueueDepth.set(this.waitQueue.length);
}
```

Instrument the following methods:

**`initialize()`** — after each browser is added to `this.browsers` and `this.available`, and after the loop:
```typescript
// After: this.isInitialized = true;
this.updatePoolGauges();
```

**`acquire()`** — wrap with acquire duration timer and update gauges:
```typescript
async acquire(): Promise<Browser> {
  const endTimer = browserPoolAcquireDuration.startTimer();

  if (!this.isInitialized) {
    await this.initialize();
  }

  if (this.available.length > 0) {
    const browser = this.available.pop()!;
    this.clearIdleTimer(browser);

    if (browser.connected) {
      browserPoolOperationsTotal.inc({ operation: 'acquire' });
      this.updatePoolGauges();
      endTimer();
      return browser;
    }

    this.removeBrowser(browser);
    endTimer();
    return this.acquire();
  }

  if (this.browsers.length < this.maxBrowsers) {
    const browser = await this.createBrowser();
    this.browsers.push(browser);
    browserPoolOperationsTotal.inc({ operation: 'acquire' });
    this.updatePoolGauges();
    endTimer();
    return browser;
  }

  // Will be timed by waitForBrowser completing
  const browser = await this.waitForBrowser();
  browserPoolOperationsTotal.inc({ operation: 'acquire' });
  this.updatePoolGauges();
  endTimer();
  return browser;
}
```

**`release()`** — add counter and gauge updates:
```typescript
// After the wait queue check:
browserPoolOperationsTotal.inc({ operation: 'release' });

// At the end (after adding to available or removing):
this.updatePoolGauges();
```

**`createBrowser()`** — increment create counter:
```typescript
// Before return browser;
browserPoolOperationsTotal.inc({ operation: 'create' });
```

**`removeBrowser()`** — increment destroy counter and update gauges:
```typescript
// At the end of removeBrowser:
browserPoolOperationsTotal.inc({ operation: 'destroy' });
this.updatePoolGauges();
```

**`waitForBrowser()`** — update queue depth when adding/removing from queue:
```typescript
// After this.waitQueue.push(wrappedResolve):
browserPoolQueueDepth.set(this.waitQueue.length);

// Inside the timeout handler, after splice:
browserPoolQueueDepth.set(this.waitQueue.length);
```

- [ ] **Step 4: Run the metrics tests**

Run: `npx vitest run tests/unit/browser-pool-metrics.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Run existing browser pool tests to confirm no regressions**

Run: `npx vitest run tests/unit/browser-pool.test.ts`
Expected: PASS (18 tests)

- [ ] **Step 6: Commit**

```bash
git add src/lib/browserPool.ts tests/unit/browser-pool-metrics.test.ts
git commit -m "feat: add Prometheus metrics instrumentation to browser pool"
```

---

### Task 7: Integrate Logger and Metrics into PDF Route

**Files:**
- Modify: `src/app/api/pdf/route.tsx`
- Test: `tests/unit/pdf-route-observability.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/pdf-route-observability.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { register } from 'prom-client';

const mockAcquire = vi.fn();
const mockRelease = vi.fn();
const mockLog = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  child: vi.fn().mockReturnThis(),
};

vi.mock('@/lib/browserPool', () => ({
  browserPool: {
    acquire: mockAcquire,
    release: mockRelease,
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => mockLog),
  logger: mockLog,
}));

vi.mock('@/lib/renderToHtml', () => ({
  renderToHtml: vi.fn().mockResolvedValue('<html></html>'),
}));

vi.mock('@/templates/basicTemplate', () => ({
  ResumeTemplate: vi.fn(),
  PAGE_PADDINGS_HORIZONTAL: '0',
  PAGE_PADDINGS_VERTICAL: '0',
}));

vi.mock('@/templates/basicTemplate/server', () => ({
  getFullHtmlDocument: vi.fn((html: string) => html),
}));

import { POST } from '@/app/api/pdf/route';
import {
  httpRequestsTotal,
  httpRequestDuration,
  pdfGenerationDuration,
  pdfGenerationTotal,
} from '@/lib/metrics';

function createMockRequest(body: Record<string, unknown>) {
  return {
    json: vi.fn().mockResolvedValue(body),
    headers: new Headers({ 'X-Request-Id': 'test-req-123' }),
  } as any;
}

const validResumeData = {
  personalInfo: {
    fullName: 'Test User',
    phone: '123',
    city: 'City',
    links: [],
    summary: 'Summary',
  },
  workExperience: [],
  education: [],
  skills: [],
  languages: [],
};

describe('PDF route observability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    register.resetMetrics();

    const mockPage = {
      setContent: vi.fn().mockResolvedValue(undefined),
      pdf: vi.fn().mockResolvedValue(Buffer.from('pdf-content')),
      close: vi.fn().mockResolvedValue(undefined),
    };
    mockAcquire.mockResolvedValue({
      newPage: vi.fn().mockResolvedValue(mockPage),
    });
    mockRelease.mockResolvedValue(undefined);
  });

  it('logs request received with requestId', async () => {
    await POST(createMockRequest(validResumeData));

    expect(mockLog.info).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: 'test-req-123' }),
      expect.stringContaining('PDF generation')
    );
  });

  it('increments http_requests_total on success', async () => {
    await POST(createMockRequest(validResumeData));

    const metrics = await register.getMetricsAsJSON();
    const httpTotal = metrics.find((m) => m.name === 'http_requests_total');

    expect(httpTotal).toBeDefined();
  });

  it('increments pdf_generation_total with success status', async () => {
    await POST(createMockRequest(validResumeData));

    const metrics = await register.getMetricsAsJSON();
    const pdfTotal = metrics.find((m) => m.name === 'pdf_generation_total');

    expect(pdfTotal).toBeDefined();
  });

  it('increments pdf_generation_total with error status on failure', async () => {
    mockAcquire.mockRejectedValueOnce(new Error('pool exhausted'));

    await POST(createMockRequest(validResumeData));

    const metrics = await register.getMetricsAsJSON();
    const pdfTotal = metrics.find((m) => m.name === 'pdf_generation_total');

    expect(pdfTotal).toBeDefined();
  });

  it('records http_request_duration_seconds', async () => {
    await POST(createMockRequest(validResumeData));

    const metrics = await register.getMetricsAsJSON();
    const duration = metrics.find((m) => m.name === 'http_request_duration_seconds');

    expect(duration).toBeDefined();
  });

  it('logs error on validation failure', async () => {
    await POST(createMockRequest({ invalid: true }));

    expect(mockLog.warn).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/pdf-route-observability.test.ts`
Expected: FAIL — PDF route doesn't use logger or record metrics yet

- [ ] **Step 3: Update the PDF route with logging and metrics**

Replace the content of `src/app/api/pdf/route.tsx` with:

```tsx
import { NextRequest, NextResponse } from 'next/server';
import { renderToHtml } from '@/lib/renderToHtml';
import { ResumeDataSchema } from '@/lib/validation';
import { browserPool } from '@/lib/browserPool';
import { createLogger } from '@/lib/logger';
import {
  httpRequestsTotal,
  httpRequestDuration,
  pdfGenerationDuration,
  pdfGenerationTotal,
} from '@/lib/metrics';
import z from 'zod';
import { ResumeTemplate, PAGE_PADDINGS_HORIZONTAL, PAGE_PADDINGS_VERTICAL } from '@/templates/basicTemplate';
import { getFullHtmlDocument } from '@/templates/basicTemplate/server';

const PDF_GENERATION_TIMEOUT = 10_000;

const log = createLogger('pdf');

export async function POST(request: NextRequest) {
    const requestId = request.headers.get('X-Request-Id') ?? undefined;
    const reqLog = requestId ? createLogger('pdf', requestId) : log;
    const endHttpTimer = httpRequestDuration.startTimer({ method: 'POST', route: '/api/pdf' });
    let browser;
    let page;
    let statusCode = 200;

    try {
        reqLog.info({ requestId }, 'PDF generation request received');

        const { data, success, error } = await request.json().then(ResumeDataSchema.safeParse);

        if (!success) {
            statusCode = 400;
            reqLog.warn({ requestId, errors: z.treeifyError(error).errors }, 'Validation failed');

            return NextResponse.json(
                {
                    error: 'Invalid resume data',
                    details: z.treeifyError(error).errors
                },
                { status: 400 }
            );
        }

        const endPdfTimer = pdfGenerationDuration.startTimer();

        const resumeHTML = await renderToHtml(<ResumeTemplate data={data} />).then(getFullHtmlDocument);

        browser = await browserPool.acquire();
        page = await browser.newPage();

        await page.setContent(resumeHTML, {
            waitUntil: 'networkidle0',
            timeout: PDF_GENERATION_TIMEOUT
        });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: PAGE_PADDINGS_VERTICAL,
                bottom: PAGE_PADDINGS_VERTICAL,
                right: PAGE_PADDINGS_HORIZONTAL,
                left: PAGE_PADDINGS_HORIZONTAL,
            },
            timeout: PDF_GENERATION_TIMEOUT
        });

        endPdfTimer({ status: 'success' });
        pdfGenerationTotal.inc({ status: 'success' });

        const duration = endHttpTimer({ status: '200' });
        httpRequestsTotal.inc({ method: 'POST', route: '/api/pdf', status: '200' });

        reqLog.info({ requestId, durationMs: Math.round(duration * 1000) }, 'PDF generated successfully');

        return new NextResponse(Buffer.from(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${data.personalInfo.fullName || 'resume'}.pdf"`,
                'X-Generation-Time': `${Math.round(duration * 1000)}ms`,
            },
        });
    } catch (error) {
        const isTimeout = error instanceof Error && error.message.includes('timeout');
        statusCode = isTimeout ? 504 : 500;
        const errorMessage = isTimeout
            ? 'PDF generation timeout. Please try again.'
            : 'Failed to generate PDF';

        const pdfStatus = isTimeout ? 'timeout' : 'error';
        pdfGenerationTotal.inc({ status: pdfStatus });

        endHttpTimer({ status: String(statusCode) });
        httpRequestsTotal.inc({ method: 'POST', route: '/api/pdf', status: String(statusCode) });

        reqLog.error({ requestId, error, statusCode }, 'PDF generation failed');

        return NextResponse.json(
            { error: errorMessage },
            { status: statusCode }
        );
    } finally {
        if (page) {
            try {
                await page.close();
            } catch (e) {
                reqLog.error({ requestId, error: e }, 'Error closing page');
            }
        }

        if (browser) {
            try {
                await browserPool.release(browser);
            } catch (e) {
                reqLog.error({ requestId, error: e }, 'Error releasing browser');
            }
        }
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/pdf-route-observability.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/pdf/route.tsx tests/unit/pdf-route-observability.test.ts
git commit -m "feat: add structured logging and metrics to PDF route"
```

---

### Task 8: Integrate Logger into Health Route

**Files:**
- Modify: `src/app/api/health/route.ts`

- [ ] **Step 1: Update the health route**

In `src/app/api/health/route.ts`, add the import at the top:

```typescript
import { createLogger } from '@/lib/logger';

const log = createLogger('health');
```

Replace the one `console.error` call (line 50):

```typescript
// Old:
console.error('Health check error:', error);
// New:
log.error({ error }, 'Health check failed');
```

- [ ] **Step 2: Run all unit tests to confirm no regressions**

Run: `npx vitest run tests/unit`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/api/health/route.ts
git commit -m "refactor: replace console logging with pino in health route"
```

---

### Task 9: Nginx Configuration Changes

**Files:**
- Modify: `nginx/nginx.conf`
- Modify: `nginx/nginx.test.conf`

- [ ] **Step 1: Add stub_status and X-Request-Id to nginx.conf**

Replace the full content of `nginx/nginx.conf`:

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=1r/s;

server {
    listen 80;

    location /nginx_status {
        stub_status;
        allow 172.0.0.0/8;
        deny all;
    }

    location /api/pdf {
        limit_req zone=api burst=5 nodelay;
        limit_req_status 429;

        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-Id $request_id;

        proxy_read_timeout 30s;
        proxy_send_timeout 30s;
    }

    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-Id $request_id;
    }

    error_page 429 @rate_limited;
    location @rate_limited {
        default_type application/json;
        add_header Retry-After 1 always;
        return 429 '{"error":"Too many requests","message":"You have exceeded the rate limit. Please try again later."}';
    }
}
```

- [ ] **Step 2: Add stub_status and X-Request-Id to nginx.test.conf**

Replace the full content of `nginx/nginx.test.conf`:

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=1r/s;

server {
    listen 80;

    # Trust X-Forwarded-For from Docker network so tests can simulate unique clients
    set_real_ip_from 0.0.0.0/0;
    real_ip_header X-Forwarded-For;

    location /nginx_status {
        stub_status;
        allow 172.0.0.0/8;
        deny all;
    }

    location /api/pdf {
        limit_req zone=api burst=5 nodelay;
        limit_req_status 429;

        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-Id $request_id;

        proxy_read_timeout 30s;
        proxy_send_timeout 30s;
    }

    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-Id $request_id;
    }

    error_page 429 @rate_limited;
    location @rate_limited {
        default_type application/json;
        add_header Retry-After 1 always;
        return 429 '{"error":"Too many requests","message":"You have exceeded the rate limit. Please try again later."}';
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add nginx/nginx.conf nginx/nginx.test.conf
git commit -m "feat: add stub_status and X-Request-Id to nginx config"
```

---

### Task 10: Prometheus Configuration

**Files:**
- Create: `prometheus/prometheus.yml`

- [ ] **Step 1: Create Prometheus config**

Create `prometheus/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'resume-app'
    metrics_path: '/api/metrics'
    static_configs:
      - targets: ['app:3000']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']
```

- [ ] **Step 2: Commit**

```bash
git add prometheus/prometheus.yml
git commit -m "feat: add Prometheus scrape configuration"
```

---

### Task 11: Grafana Provisioning and Dashboard

**Files:**
- Create: `grafana/provisioning/datasources/datasource.yml`
- Create: `grafana/provisioning/dashboards/dashboard.yml`
- Create: `grafana/dashboards/overview.json`

- [ ] **Step 1: Create datasource provisioning**

Create `grafana/provisioning/datasources/datasource.yml`:

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
```

- [ ] **Step 2: Create dashboard provisioning config**

Create `grafana/provisioning/dashboards/dashboard.yml`:

```yaml
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 30
    options:
      path: /var/lib/grafana/dashboards
      foldersFromFilesStructure: false
```

- [ ] **Step 3: Create the overview dashboard**

Create `grafana/dashboards/overview.json`:

```json
{
  "annotations": { "list": [] },
  "editable": true,
  "fiscalYearStartMonth": 0,
  "graphTooltip": 1,
  "links": [],
  "panels": [
    {
      "title": "Request Rate (RPS)",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 },
      "targets": [
        {
          "expr": "rate(http_requests_total[5m])",
          "legendFormat": "{{method}} {{route}} {{status}}",
          "refId": "A"
        }
      ],
      "fieldConfig": {
        "defaults": { "unit": "reqps" },
        "overrides": []
      }
    },
    {
      "title": "Error Rate",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 12, "y": 0 },
      "targets": [
        {
          "expr": "rate(http_requests_total{status=~\"4..|5..\"}[5m])",
          "legendFormat": "{{status}} {{route}}",
          "refId": "A"
        }
      ],
      "fieldConfig": {
        "defaults": { "unit": "reqps" },
        "overrides": []
      }
    },
    {
      "title": "Request Latency Percentiles",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 0, "y": 8 },
      "targets": [
        {
          "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
          "legendFormat": "p50",
          "refId": "A"
        },
        {
          "expr": "histogram_quantile(0.90, rate(http_request_duration_seconds_bucket[5m]))",
          "legendFormat": "p90",
          "refId": "B"
        },
        {
          "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
          "legendFormat": "p95",
          "refId": "C"
        },
        {
          "expr": "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))",
          "legendFormat": "p99",
          "refId": "D"
        }
      ],
      "fieldConfig": {
        "defaults": { "unit": "s" },
        "overrides": []
      }
    },
    {
      "title": "PDF Generation Duration",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 12, "y": 8 },
      "targets": [
        {
          "expr": "histogram_quantile(0.50, rate(pdf_generation_duration_seconds_bucket[5m]))",
          "legendFormat": "p50",
          "refId": "A"
        },
        {
          "expr": "histogram_quantile(0.95, rate(pdf_generation_duration_seconds_bucket[5m]))",
          "legendFormat": "p95",
          "refId": "B"
        },
        {
          "expr": "histogram_quantile(0.99, rate(pdf_generation_duration_seconds_bucket[5m]))",
          "legendFormat": "p99",
          "refId": "C"
        }
      ],
      "fieldConfig": {
        "defaults": { "unit": "s" },
        "overrides": []
      }
    },
    {
      "title": "PDF Generation Rate",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 0, "y": 16 },
      "targets": [
        {
          "expr": "rate(pdf_generation_total[5m])",
          "legendFormat": "{{status}}",
          "refId": "A"
        }
      ],
      "fieldConfig": {
        "defaults": { "unit": "ops" },
        "overrides": []
      }
    },
    {
      "title": "Browser Pool Size",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 12, "y": 16 },
      "targets": [
        {
          "expr": "browser_pool_size",
          "legendFormat": "{{state}}",
          "refId": "A"
        }
      ],
      "fieldConfig": {
        "defaults": { "unit": "short" },
        "overrides": []
      }
    },
    {
      "title": "Browser Pool Queue Depth",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 0, "y": 24 },
      "targets": [
        {
          "expr": "browser_pool_queue_depth",
          "legendFormat": "waiting",
          "refId": "A"
        }
      ],
      "fieldConfig": {
        "defaults": { "unit": "short" },
        "overrides": []
      }
    },
    {
      "title": "Browser Acquire Wait Time",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 12, "y": 24 },
      "targets": [
        {
          "expr": "histogram_quantile(0.95, rate(browser_pool_acquire_duration_seconds_bucket[5m]))",
          "legendFormat": "p95",
          "refId": "A"
        },
        {
          "expr": "histogram_quantile(0.99, rate(browser_pool_acquire_duration_seconds_bucket[5m]))",
          "legendFormat": "p99",
          "refId": "B"
        }
      ],
      "fieldConfig": {
        "defaults": { "unit": "s" },
        "overrides": []
      }
    },
    {
      "title": "Node.js Heap Usage",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 0, "y": 32 },
      "targets": [
        {
          "expr": "nodejs_heap_size_used_bytes",
          "legendFormat": "heap used",
          "refId": "A"
        },
        {
          "expr": "nodejs_heap_size_total_bytes",
          "legendFormat": "heap total",
          "refId": "B"
        }
      ],
      "fieldConfig": {
        "defaults": { "unit": "bytes" },
        "overrides": []
      }
    },
    {
      "title": "Node.js Event Loop Lag",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 12, "y": 32 },
      "targets": [
        {
          "expr": "nodejs_eventloop_lag_seconds",
          "legendFormat": "event loop lag",
          "refId": "A"
        }
      ],
      "fieldConfig": {
        "defaults": { "unit": "s" },
        "overrides": []
      }
    },
    {
      "title": "Nginx Active Connections",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 0, "y": 40 },
      "targets": [
        {
          "expr": "nginx_connections_active",
          "legendFormat": "active",
          "refId": "A"
        },
        {
          "expr": "nginx_connections_reading",
          "legendFormat": "reading",
          "refId": "B"
        },
        {
          "expr": "nginx_connections_writing",
          "legendFormat": "writing",
          "refId": "C"
        },
        {
          "expr": "nginx_connections_waiting",
          "legendFormat": "waiting",
          "refId": "D"
        }
      ],
      "fieldConfig": {
        "defaults": { "unit": "short" },
        "overrides": []
      }
    },
    {
      "title": "Nginx Request Rate",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 12, "y": 40 },
      "targets": [
        {
          "expr": "rate(nginx_http_requests_total[5m])",
          "legendFormat": "requests/s",
          "refId": "A"
        }
      ],
      "fieldConfig": {
        "defaults": { "unit": "reqps" },
        "overrides": []
      }
    }
  ],
  "schemaVersion": 39,
  "tags": ["resume-builder", "observability"],
  "templating": { "list": [] },
  "time": { "from": "now-1h", "to": "now" },
  "title": "Resume Builder Overview",
  "uid": "resume-builder-overview"
}
```

- [ ] **Step 4: Commit**

```bash
git add grafana/
git commit -m "feat: add Grafana provisioning and overview dashboard"
```

---

### Task 12: Update Docker Compose

**Files:**
- Modify: `docker-compose.yml`

- [ ] **Step 1: Add monitoring services to docker-compose.yml**

Replace the full content of `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # Nginx reverse proxy with rate limiting
  nginx:
    image: nginx:alpine
    container_name: resume_nginx
    restart: unless-stopped
    ports:
      - "3000:80"
    volumes:
      - ${NGINX_CONFIG_PATH}:/etc/nginx/conf.d/default.conf:ro
    environment:
      - RATE_LIMIT=${RATE_LIMIT}
      - RATE_BURST=${RATE_BURST}
      - NGINX_ENVSUBST_VARS=RATE_LIMIT,RATE_BURST
    depends_on:
      app:
        condition: service_healthy
    networks:
      - resume_network

  # Next.js application
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    container_name: resume_app
    restart: unless-stopped
    environment:
      - NODE_ENV=${NODE_ENV}
      - LOG_LEVEL=${LOG_LEVEL:-info}
      - BROWSER_POOL_MIN=${BROWSER_POOL_MIN}
      - BROWSER_POOL_MAX=${BROWSER_POOL_MAX}
      - BROWSER_POOL_IDLE_TIMEOUT_MS=${BROWSER_POOL_IDLE_TIMEOUT_MS}
      - PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
    networks:
      - resume_network
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M

  # Prometheus metrics collection
  prometheus:
    image: prom/prometheus
    container_name: resume_prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    depends_on:
      app:
        condition: service_healthy
    networks:
      - resume_network

  # Grafana dashboards
  grafana:
    image: grafana/grafana
    container_name: resume_grafana
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-admin}
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - ./grafana/dashboards:/var/lib/grafana/dashboards:ro
      - grafana_data:/var/lib/grafana
    depends_on:
      - prometheus
    networks:
      - resume_network

  # Nginx Prometheus exporter
  nginx-exporter:
    image: nginx/nginx-prometheus-exporter
    container_name: resume_nginx_exporter
    restart: unless-stopped
    command:
      - '--nginx.scrape-uri=http://nginx:80/nginx_status'
    depends_on:
      - nginx
    networks:
      - resume_network

networks:
  resume_network:
    driver: bridge

volumes:
  prometheus_data:
  grafana_data:
```

- [ ] **Step 2: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add Prometheus, Grafana, and nginx-exporter to Docker Compose"
```

---

### Task 13: Final Verification

- [ ] **Step 1: Run all unit tests**

Run: `npx vitest run tests/unit`
Expected: All tests PASS

- [ ] **Step 2: Verify Nginx config syntax**

Run: `docker run --rm -v $(pwd)/nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro nginx:alpine nginx -t`
Expected: `nginx: configuration file /etc/nginx/nginx.conf test is successful`

- [ ] **Step 3: Verify Prometheus config syntax**

Run: `docker run --rm -v $(pwd)/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro prom/prometheus promtool check config /etc/prometheus/prometheus.yml`
Expected: `SUCCESS: prometheus.yml is valid`

- [ ] **Step 4: Commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix: address issues found during verification"
```

Only create this commit if fixes were needed. If everything passed, skip this step.
