# Browser Pool Test Suite Design

## Overview

Add a comprehensive test suite for the `BrowserPool` class using Vitest. Two test layers: unit tests with mocked Puppeteer for edge cases and internal behavior, integration tests against a running Docker Compose stack for real-world behavior and performance benchmarks.

## Scope

- **In scope:** BrowserPool unit tests, integration tests via HTTP, performance benchmarks
- **Out of scope:** Rate limiting tests (nginx responsibility), UI/frontend tests

## Test Infrastructure

### Framework & Dependencies

- **Vitest** as test runner (dev dependency)
- Native `fetch` for HTTP calls (Node 20 built-in)
- `vi.mock('puppeteer')` for unit test mocking

### File Structure

```
tests/
  integration/
    browser-pool.test.ts     — pool behavior via /api/pdf and /api/health
    performance.test.ts      — response time benchmarks under load
  unit/
    browser-pool.test.ts     — BrowserPool class with mocked Puppeteer
  fixtures/
    test-data.ts             — exports test-data.json as typed constant
  helpers/
    http.ts                  — shared fetch wrapper (base URL, headers)
vitest.config.ts             — two projects: "unit" and "integration"
```

### Vitest Config

Two projects so they can be run independently:
- `unit` project: `tests/unit/**/*.test.ts`
- `integration` project: `tests/integration/**/*.test.ts`

### package.json Scripts

- `test` — runs unit tests only
- `test:integration` — runs integration tests (expects Docker Compose stack running on localhost:3000)
- `test:all` — runs both

### Source Change

Export the `BrowserPool` class from `src/lib/browserPool.ts` (currently only the singleton instance is exported). Add: `export { BrowserPool }`.

## Unit Tests

**File:** `tests/unit/browser-pool.test.ts`

Mock `puppeteer.launch()` to return controllable fake browser objects with `connected`, `pages()`, `close()`, `on()`, `newPage()`.

### Initialization

| # | Test | Assertion |
|---|------|-----------|
| 1 | Creates min browsers on initialize | `puppeteer.launch` called `min` times |
| 2 | Handles partial initialization failure | Pool initializes with remaining browsers when one launch rejects |
| 3 | Double initialize is idempotent | Concurrent `initialize()` calls result in only `min` launches |

### Acquire/Release

| # | Test | Assertion |
|---|------|-----------|
| 4 | Acquire returns available browser | Returns a mock browser object |
| 5 | Acquire auto-initializes if not initialized | Calling `acquire()` without `initialize()` triggers initialization |
| 6 | Release returns browser to available pool | `getStats().available` increases after release |
| 7 | Release closes extra pages | `page.close()` called on pages beyond the first |
| 8 | Release prioritizes wait queue | Waiting acquire resolves when a browser is released |

### Concurrency & Pool Limits

| # | Test | Assertion |
|---|------|-----------|
| 9 | Creates new browser when none available but under max | New `puppeteer.launch` call when available is empty but total < max |
| 10 | Queues when at max capacity | Third acquire on max=2 pool does not resolve immediately |
| 11 | Wait queue timeout rejects | Acquire rejects with "Browser acquisition timeout" after `idleTimeoutMs` |

### Disconnected Browser Handling

| # | Test | Assertion |
|---|------|-----------|
| 12 | Acquire skips disconnected browser | Creates new browser when available one has `connected = false` |
| 13 | Disconnected event removes browser from pool | `getStats().total` decreases after triggering disconnect callback |
| 14 | Release of disconnected browser removes it | Browser removed from pool, not added to available |

### Destroy

| # | Test | Assertion |
|---|------|-----------|
| 15 | Destroy closes all browsers | `close()` called on each browser |
| 16 | Destroy clears wait queue | Queue emptied, no pending resolves |
| 17 | Destroy resets state | `getStats()` returns zeros, pool not initialized |

### Stats

| # | Test | Assertion |
|---|------|-----------|
| 18 | getStats reflects accurate counts | Stats match expected state after various acquire/release combinations |

## Integration Tests

**File:** `tests/integration/browser-pool.test.ts`
**Prerequisite:** Docker Compose stack running on `localhost:3000`

Tests use `describe.sequential` to prevent interference.

| # | Test | Assertion |
|---|------|-----------|
| 1 | Health endpoint returns pool stats | GET `/api/health` → 200, body contains `browserPool` with `total`, `available`, `inUse`, `waiting`, `maxBrowsers`, `utilization` |
| 2 | Single PDF generation succeeds | POST `/api/pdf` → 200, `Content-Type: application/pdf`, `X-Generation-Time` header, non-empty body |
| 3 | Sequential PDFs reuse browsers | 3 sequential POSTs, health check shows stable `total` (not growing) |
| 4 | Concurrent requests all succeed | 5 simultaneous POSTs, all return 200 |
| 5 | Invalid data returns 400 without pool impact | POST invalid JSON → 400, pool stats unchanged (no browser acquired) |
| 6 | Pool stats reflect concurrent load | During concurrent requests, health shows `inUse > 0` |
| 7 | Browsers return to pool after requests | After all requests complete, health shows `inUse = 0`, `available = total` |

## Performance Benchmarks

**File:** `tests/integration/performance.test.ts`
**Prerequisite:** Docker Compose stack running on `localhost:3000`
**Timeout:** 30 seconds per test

| # | Test | Metric | Threshold |
|---|------|--------|-----------|
| 1 | Cold start response time | First request total time | < 5s |
| 2 | Warm response time | Second request total time | < 3s |
| 3 | Sequential throughput | Average of 10 sequential requests | Report mean, p95 |
| 4 | Concurrent throughput | 10 simultaneous requests | All succeed, report mean, p95, total elapsed |
| 5 | Pool scaling under load | 15 concurrent requests (exceeds min, within max) | All eventually succeed, report peak `inUse` and `total` growth |

Results printed as a readable table in test output via `console.log`.

## Test Data

Reuse existing `test-data.json` (valid resume data with 3 work experiences, 2 education entries, 8 skills, 3 languages). Export as typed constant from `tests/fixtures/test-data.ts`.

## Helper Module

`tests/helpers/http.ts`:
- `BASE_URL` constant (default `http://localhost:3000`)
- `generatePdf(data)` — POST to `/api/pdf`, returns response
- `getHealth()` — GET to `/api/health`, returns parsed JSON
- Configurable via `TEST_BASE_URL` env var for flexibility
