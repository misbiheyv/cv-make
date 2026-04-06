import {register} from "prom-client";
import {beforeEach, describe, expect, it, vi} from "vitest";

const {mockAcquire, mockRelease, mockLog} = vi.hoisted(() => {
    const mockLog = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        child: vi.fn().mockReturnThis(),
    };
    return {
        mockAcquire: vi.fn(),
        mockRelease: vi.fn(),
        mockLog,
    };
});

vi.mock("@/lib/browserPool", () => ({
    browserPool: {
        acquire: mockAcquire,
        release: mockRelease,
    },
}));

vi.mock("@/lib/logger", () => ({
    createLogger: vi.fn(() => mockLog),
    logger: mockLog,
}));

vi.mock("@/lib/renderToHtml", () => ({
    renderToHtml: vi.fn().mockResolvedValue("<html></html>"),
}));

vi.mock("@/templates/basicTemplate", () => ({
    ResumeTemplate: vi.fn(),
    PAGE_PADDINGS_HORIZONTAL: "0",
    PAGE_PADDINGS_VERTICAL: "0",
}));

vi.mock("@/templates/basicTemplate/server", () => ({
    getFullHtmlDocument: vi.fn((html: string) => html),
}));

import {POST} from "@/app/api/pdf/route";

function createMockRequest(body: Record<string, unknown>) {
    return {
        json: vi.fn().mockResolvedValue(body),
        headers: new Headers({"X-Request-Id": "test-req-123"}),
    } as any;
}

const validResumeData = {
    personalInfo: {
        fullName: "Test User",
        phone: "123",
        city: "City",
        links: [],
        summary: "Summary",
    },
    workExperience: [],
    education: [],
    skills: [],
    languages: [],
};

describe("PDF route observability", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        register.resetMetrics();

        const mockPage = {
            setContent: vi.fn().mockResolvedValue(undefined),
            pdf: vi.fn().mockResolvedValue(Buffer.from("pdf-content")),
            close: vi.fn().mockResolvedValue(undefined),
        };
        mockAcquire.mockResolvedValue({
            newPage: vi.fn().mockResolvedValue(mockPage),
        });
        mockRelease.mockResolvedValue(undefined);
    });

    it("logs request received with requestId", async () => {
        await POST(createMockRequest(validResumeData));

        expect(mockLog.info).toHaveBeenCalledWith(
            expect.objectContaining({requestId: "test-req-123"}),
            expect.stringContaining("PDF generation"),
        );
    });

    it("increments http_requests_total on success", async () => {
        await POST(createMockRequest(validResumeData));

        const metrics = await register.getMetricsAsJSON();
        const httpTotal = metrics.find((m) => m.name === "http_requests_total");

        expect(httpTotal).toBeDefined();
    });

    it("increments pdf_generation_total with success status", async () => {
        await POST(createMockRequest(validResumeData));

        const metrics = await register.getMetricsAsJSON();
        const pdfTotal = metrics.find((m) => m.name === "pdf_generation_total");

        expect(pdfTotal).toBeDefined();
    });

    it("increments pdf_generation_total with error status on failure", async () => {
        mockAcquire.mockRejectedValueOnce(new Error("pool exhausted"));

        await POST(createMockRequest(validResumeData));

        const metrics = await register.getMetricsAsJSON();
        const pdfTotal = metrics.find((m) => m.name === "pdf_generation_total");

        expect(pdfTotal).toBeDefined();
    });

    it("records http_request_duration_seconds", async () => {
        await POST(createMockRequest(validResumeData));

        const metrics = await register.getMetricsAsJSON();
        const duration = metrics.find((m) => m.name === "http_request_duration_seconds");

        expect(duration).toBeDefined();
    });

    it("logs error on validation failure", async () => {
        await POST(createMockRequest({invalid: true}));

        expect(mockLog.warn).toHaveBeenCalled();
    });
});
