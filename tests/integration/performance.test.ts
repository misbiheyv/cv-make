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
