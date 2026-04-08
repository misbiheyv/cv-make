// @vitest-environment node
import {beforeEach, describe, expect, it, vi} from "vitest";

vi.mock("prom-client", () => {
    const mockRegister = {
        metrics: vi
            .fn()
            .mockResolvedValue("# HELP http_requests_total Total\nhttp_requests_total 0"),
        contentType: "text/plain; version=0.0.4; charset=utf-8",
        resetMetrics: vi.fn(),
    };
    return {
        register: mockRegister,
        Counter: vi.fn().mockImplementation(() => ({inc: vi.fn(), name: ""})),
        Histogram: vi.fn().mockImplementation(() => ({startTimer: vi.fn(), name: ""})),
        Gauge: vi.fn().mockImplementation(() => ({set: vi.fn(), name: ""})),
        collectDefaultMetrics: vi.fn(),
    };
});

import {register} from "prom-client";
import {GET} from "@/app/api/metrics/route";

describe("GET /api/metrics", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns metrics in prometheus text format", async () => {
        const response = await GET();

        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Type")).toBe(
            "text/plain; version=0.0.4; charset=utf-8",
        );

        const body = await response.text();
        expect(body).toContain("http_requests_total");
    });

    it("returns 500 if metrics collection fails", async () => {
        vi.mocked(register.metrics).mockRejectedValueOnce(new Error("metrics failed"));

        const response = await GET();

        expect(response.status).toBe(500);
    });
});
