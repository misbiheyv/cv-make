"use client";

import {Download, Loader2} from "lucide-react";
import {useState} from "react";
import {toast} from "sonner";
import {useResumeStore} from "@/store/useResumeStore";

export function DownloadButton() {
    const getResumeData = useResumeStore((state) => state.getResumeData);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        setIsDownloading(true);

        try {
            const resumeData = getResumeData();

            const response = await fetch("/api/pdf", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(resumeData),
            });

            if (!response.ok) {
                const contentType = response.headers.get("content-type");
                let errorData: Record<string, string> = {};

                if (contentType?.includes("application/json")) {
                    errorData = await response.json();
                }

                if (response.status === 429) {
                    const retryAfter = parseInt(response.headers.get("retry-after") || "0", 10);
                    toast.warning(
                        errorData.message || "Too many requests. Please wait before trying again.",
                        {
                            duration: Infinity,
                            description: retryAfter
                                ? `Please wait ${retryAfter} seconds before trying again.`
                                : undefined,
                        },
                    );
                    return;
                }

                if (response.status === 504) {
                    toast.error("PDF generation timed out. Please try again.");
                    return;
                }

                if (response.status === 400) {
                    toast.error("Invalid resume data. Please check your information.");
                    return;
                }

                toast.error(errorData.error || "Failed to generate PDF. Please try again.");
                return;
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${resumeData.personalInfo.fullName || "resume"}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Download error:", error);
            toast.error("Network error. Please check your connection and try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="btn-primary group flex items-center gap-0 hover:gap-2 shadow-md disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden transition-all duration-200"
        >
            {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
                <Download className="w-4 h-4 shrink-0" />
            )}
            <span className="max-w-0 group-hover:max-w-xs opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap overflow-hidden">
                {isDownloading ? "Generating..." : "Download PDF"}
            </span>
        </button>
    );
}
