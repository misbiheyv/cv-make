import {describe, expect, it} from "vitest";
import {VALID_RESUME_DATA} from "../fixtures/test-data";
import {generatePdf, getHealth} from "../helpers/http";

function uniqueIp(index: number): string {
    return `10.0.${Math.floor(index / 256)}.${(index % 256) + 1}`;
}

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

async function timedPdf(ip?: string): Promise<{duration: number; status: number}> {
    const start = performance.now();
    const res = await generatePdf(VALID_RESUME_DATA, ip ? {ip} : undefined);
    const duration = performance.now() - start;
    return {duration, status: res.status};
}

describe("Performance Benchmarks", () => {
    it("cold start responds under 5 seconds", async () => {
        const {duration, status} = await timedPdf(uniqueIp(0));

        console.log(`\n  Cold start: ${formatMs(duration)}`);

        expect(status).toBe(200);
        expect(duration).toBeLessThan(5000);
    }, 32000);

    it("warm request responds under 5 seconds", async () => {
        // Warmup request
        await timedPdf(uniqueIp(100));

        // Measured request
        const {duration, status} = await timedPdf(uniqueIp(101));

        console.log(`\n  Warm request: ${formatMs(duration)}`);

        expect(status).toBe(200);
        expect(duration).toBeLessThan(5000);
    }, 32000);

    it("sequential throughput over 10 requests", async () => {
        // Warmup
        await timedPdf(uniqueIp(200));

        const durations: number[] = [];
        for (let i = 0; i < 10; i++) {
            const {duration, status} = await timedPdf(uniqueIp(201 + i));
            expect(status).toBe(200);
            durations.push(duration);
        }

        printTable("Sequential throughput (10 requests)", durations);
    }, 32000);

    it("concurrent throughput with 10 simultaneous requests", async () => {
        // Warmup
        await timedPdf(uniqueIp(300));

        const totalStart = performance.now();

        const results = await Promise.all(
            Array.from({length: 10}, (_, i) => timedPdf(uniqueIp(301 + i))),
        );

        const totalElapsed = performance.now() - totalStart;
        const durations = results.map((r) => r.duration);

        results.forEach((r) => {
            expect(r.status).toBe(200);
        });

        printTable("Concurrent throughput (10 simultaneous)", durations);
        console.log(`    Total wall time: ${formatMs(totalElapsed)}`);
    }, 32000);

    it("pool scales under heavy concurrent load (500 requests)", async () => {
        // Warmup
        await timedPdf(uniqueIp(400));

        const healthBefore = await getHealth();
        const totalStart = performance.now();

        const results = await Promise.all(
            Array.from(
                {length: 500},
                (_, i) =>
                    new Promise<{duration: number; status: number}>((resolve) =>
                        setTimeout(
                            () => timedPdf(uniqueIp(401 + i)).then(resolve),
                            Math.floor(Math.random() * 10_000),
                        ),
                    ),
            ),
        );

        const totalElapsed = performance.now() - totalStart;

        const healthAfter = await getHealth();

        const successes = results.filter((r) => r.status === 200);
        const busyResponses = results.filter((r) => r.status === 503);
        const errors = results.filter((r) => r.status !== 200 && r.status !== 503);

        // No 500 errors should occur — only 200s and 503s
        expect(errors).toHaveLength(0);

        // At least some requests should succeed
        expect(successes.length).toBeGreaterThan(0);

        // Pool should never exceed maxBrowsers
        expect(healthAfter.browserPool.total).toBeLessThanOrEqual(
            healthAfter.browserPool.maxBrowsers,
        );

        // 503 responses should have Retry-After header (tested via route-level integration)
        if (successes.length > 0) {
            printTable(
                "Successful requests",
                successes.map((r) => r.duration),
            );
        }

        console.log(`\n  Heavy load summary (500 requests):`);
        console.log(`    Successes (200): ${successes.length}`);
        console.log(`    Queue full (503): ${busyResponses.length}`);
        console.log(`    Errors (5xx): ${errors.length}`);
        console.log(`    Total wall time: ${formatMs(totalElapsed)}`);
        console.log(
            `    Pool before: total=${healthBefore.browserPool.total}, max=${healthBefore.browserPool.maxBrowsers}`,
        );
        console.log(
            `    Pool after:  total=${healthAfter.browserPool.total}, max=${healthAfter.browserPool.maxBrowsers}`,
        );
    }, 320000);
});
