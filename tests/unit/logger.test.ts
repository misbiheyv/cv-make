// @vitest-environment node
import {beforeEach, describe, expect, it, vi} from "vitest";

vi.mock("pino", () => {
    const childFn = vi.fn().mockReturnThis();
    const logger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        child: childFn,
    };
    return {default: vi.fn(() => logger)};
});

import pino from "pino";
import {createLogger, logger} from "@/lib/logger";

describe("logger", () => {
    beforeEach(() => {
        vi.mocked(logger.info).mockClear();
        vi.mocked(logger.error).mockClear();
        vi.mocked(logger.warn).mockClear();
        vi.mocked(logger.debug).mockClear();
        vi.mocked(logger.child).mockClear();
    });

    it("exports a default logger instance", () => {
        expect(logger).toBeDefined();
        expect(logger.info).toBeDefined();
        expect(logger.error).toBeDefined();
        expect(logger.warn).toBeDefined();
        expect(logger.debug).toBeDefined();
    });

    it("createLogger returns a child logger with component field", () => {
        createLogger("browserPool");

        expect(logger.child).toHaveBeenCalledWith({component: "browserPool"});
    });

    it("createLogger with requestId includes it in child context", () => {
        createLogger("pdf", "req-123");

        expect(logger.child).toHaveBeenCalledWith({
            component: "pdf",
            requestId: "req-123",
        });
    });

    it("pino is initialized with correct base config", () => {
        expect(pino).toHaveBeenCalledWith(
            expect.objectContaining({
                level: expect.any(String),
                base: expect.objectContaining({
                    service: "cv-make",
                }),
            }),
        );
    });
});
