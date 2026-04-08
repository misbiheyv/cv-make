import {cleanup, fireEvent, render, waitFor} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

// Mock zustand store
vi.mock("@/store/useResumeStore", () => ({
    useResumeStore: (selector: (state: Record<string, unknown>) => unknown) =>
        selector({
            getResumeData: () => ({
                personalInfo: {fullName: "Test User", links: [], summary: ""},
                workExperience: [],
                education: [],
                skills: [],
                languages: [],
            }),
        }),
}));

// Mock sonner
vi.mock("sonner", () => ({
    toast: {error: vi.fn(), warning: vi.fn()},
}));

describe("DownloadButton analytics events", () => {
    let gtagMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        gtagMock = vi.fn();
        (globalThis as Record<string, unknown>).gtag = gtagMock;
    });

    afterEach(() => {
        delete (globalThis as Record<string, unknown>).gtag;
        cleanup();
        vi.restoreAllMocks();
    });

    it("fires pdf_download event on successful download", async () => {
        const pdfBlob = new Blob(["fake-pdf"], {type: "application/pdf"});
        global.fetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            blob: () => Promise.resolve(pdfBlob),
        });
        global.URL.createObjectURL = vi.fn().mockReturnValue("blob:fake");
        global.URL.revokeObjectURL = vi.fn();

        const {DownloadButton} = await import("@/components/DownloadButton");
        const {getByRole} = render(<DownloadButton />);
        fireEvent.click(getByRole("button"));

        await waitFor(() => {
            expect(gtagMock).toHaveBeenCalledWith("event", "pdf_download", {
                event_category: "conversion",
            });
        });
    });

    it("fires pdf_download_error event on failed download", async () => {
        global.fetch = vi.fn().mockResolvedValueOnce({
            ok: false,
            status: 500,
            headers: {get: () => "application/json"},
            json: () => Promise.resolve({error: "Server error"}),
        });

        const {DownloadButton} = await import("@/components/DownloadButton");
        const {getByRole} = render(<DownloadButton />);
        fireEvent.click(getByRole("button"));

        await waitFor(() => {
            expect(gtagMock).toHaveBeenCalledWith("event", "pdf_download_error", {
                event_category: "error",
            });
        });
    });

    it("does not throw when gtag is undefined", async () => {
        delete (globalThis as Record<string, unknown>).gtag;
        const pdfBlob = new Blob(["fake-pdf"], {type: "application/pdf"});
        global.fetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            blob: () => Promise.resolve(pdfBlob),
        });
        global.URL.createObjectURL = vi.fn().mockReturnValue("blob:fake");
        global.URL.revokeObjectURL = vi.fn();

        const {DownloadButton} = await import("@/components/DownloadButton");
        const {getByRole} = render(<DownloadButton />);

        // Should not throw
        expect(() => fireEvent.click(getByRole("button"))).not.toThrow();
    });
});
