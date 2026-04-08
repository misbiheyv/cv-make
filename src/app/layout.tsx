import type {Metadata} from "next";
import {Toaster} from "sonner";
import "./globals.css";

export const metadata: Metadata = {
    metadataBase: new URL("https://cv-make.com"),
    title: {
        default: "CV Make — Free Online Resume Builder",
        template: "%s | CV Make",
    },
    description:
        "Create professional resumes for free with CV Make. Real-time preview, PDF export, developer-friendly. No sign-up required.",
    keywords: [
        "resume builder",
        "CV maker",
        "free resume builder",
        "developer resume",
        "create resume online",
        "tech CV maker",
        "programmer resume",
        "PDF resume",
    ],
    applicationName: "CV Make",
    creator: "CV Make",
    category: "technology",
    openGraph: {
        type: "website",
        locale: "en_US",
        siteName: "CV Make",
        title: "CV Make — Free Online Resume Builder",
        description:
            "Create professional resumes for free. Real-time preview, PDF export, no sign-up required.",
    },
    twitter: {
        card: "summary",
        title: "CV Make — Free Online Resume Builder",
        description:
            "Create professional resumes for free. Real-time preview, PDF export, no sign-up required.",
    },
    icons: {
        icon: [{url: "/favicon.svg", type: "image/svg+xml"}],
    },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
    return (
        <html lang="en">
            <body className="antialiased">
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        name: "CV Make",
                        url: "https://cv-make.com",
                        description:
                            "Free online resume builder with real-time preview and PDF export",
                        applicationCategory: "BusinessApplication",
                        operatingSystem: "Any",
                        offers: {
                            "@type": "Offer",
                            price: "0",
                            priceCurrency: "USD",
                        },
                        browserRequirements: "Requires a modern web browser",
                    })}
                </script>
                {children}
                <Toaster position="top-right" richColors />
            </body>
        </html>
    );
}
