# SEO Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add comprehensive SEO support — metadata, robots, sitemap, manifest, JSON-LD structured data, a server-rendered landing page at `/`, and move the editor to `/editor`.

**Architecture:** Next.js 15 built-in metadata API (file-based conventions for robots/sitemap/manifest, `metadata` export for per-page meta). Landing page is a server component; editor stays a client component at a new route. JSON-LD injected via `<script>` tag in root layout.

**Tech Stack:** Next.js 15 (App Router), React 19, Tailwind CSS 4, lucide-react (icons), Biome (formatter/linter)

**Formatting rules (Biome):** 4-space indent, double quotes, semicolons, trailing commas, no bracket spacing. Run `npm run lint:fix` to auto-format.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/app/layout.tsx` | Edit | Enhanced metadata + JSON-LD script |
| `src/app/robots.ts` | Create | Crawler rules + sitemap reference |
| `src/app/sitemap.ts` | Create | URL entries for `/` and `/editor` |
| `src/app/manifest.ts` | Create | PWA web app manifest |
| `src/app/editor/page.tsx` | Create | Editor page (moved from `src/app/page.tsx`) |
| `src/app/editor/layout.tsx` | Create | Editor-specific metadata |
| `src/app/page.tsx` | Rewrite | Landing page (server component) |

---

### Task 1: Create `robots.ts`

**Files:**
- Create: `src/app/robots.ts`

- [ ] **Step 1: Create the robots file**

```ts
import type {MetadataRoute} from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: "/api/",
            },
        ],
        sitemap: "https://cv-make.com/sitemap.xml",
    };
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 3: Lint**

Run: `npm run lint:fix`
Expected: No errors (or auto-fixed)

- [ ] **Step 4: Commit**

```bash
git add src/app/robots.ts
git commit -m "feat(seo): add robots.ts with crawler rules"
```

---

### Task 2: Create `sitemap.ts`

**Files:**
- Create: `src/app/sitemap.ts`

- [ ] **Step 1: Create the sitemap file**

```ts
import type {MetadataRoute} from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: "https://cv-make.com",
            priority: 1.0,
        },
        {
            url: "https://cv-make.com/editor",
            priority: 0.8,
        },
    ];
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 3: Lint**

Run: `npm run lint:fix`
Expected: No errors (or auto-fixed)

- [ ] **Step 4: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat(seo): add sitemap.ts with landing and editor URLs"
```

---

### Task 3: Create `manifest.ts`

**Files:**
- Create: `src/app/manifest.ts`

- [ ] **Step 1: Create the manifest file**

```ts
import type {MetadataRoute} from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "CV Make",
        short_name: "CV Make",
        description: "Free online resume builder with real-time preview and PDF export",
        start_url: "/",
        display: "standalone",
        background_color: "#f9fafb",
        theme_color: "#111111",
    };
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 3: Lint**

Run: `npm run lint:fix`
Expected: No errors (or auto-fixed)

- [ ] **Step 4: Commit**

```bash
git add src/app/manifest.ts
git commit -m "feat(seo): add web app manifest"
```

---

### Task 4: Enhance root layout metadata + JSON-LD

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace the metadata export**

Replace the existing `metadata` export (lines 5–11 of `src/app/layout.tsx`) with:

```ts
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
```

- [ ] **Step 2: Add JSON-LD structured data to the body**

In the `RootLayout` component, add a `<script>` tag inside `<body>` before `{children}`:

```tsx
export default function RootLayout({children}: {children: React.ReactNode}) {
    return (
        <html lang="en">
            <body className="antialiased">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "WebApplication",
                            "name": "CV Make",
                            "url": "https://cv-make.com",
                            "description":
                                "Free online resume builder with real-time preview and PDF export",
                            "applicationCategory": "BusinessApplication",
                            "operatingSystem": "Any",
                            "offers": {
                                "@type": "Offer",
                                "price": "0",
                                "priceCurrency": "USD",
                            },
                            "browserRequirements": "Requires a modern web browser",
                        }),
                    }}
                />
                {children}
                <Toaster position="top-right" richColors />
            </body>
        </html>
    );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 4: Lint**

Run: `npm run lint:fix`
Expected: No errors (or auto-fixed)

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(seo): enhance root metadata with OG, Twitter, keywords, and JSON-LD"
```

---

### Task 5: Move editor to `/editor` route

**Files:**
- Create: `src/app/editor/page.tsx`
- Create: `src/app/editor/layout.tsx`

- [ ] **Step 1: Create the editor directory**

```bash
mkdir -p src/app/editor
```

- [ ] **Step 2: Create `src/app/editor/page.tsx`**

This is the current `src/app/page.tsx` content moved to the new route:

```tsx
"use client";

import {ResumePreview} from "@/components/ResumePreview";
import {Sidebar} from "@/components/Sidebar";

export default function Editor() {
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                <ResumePreview />
            </main>
        </div>
    );
}
```

- [ ] **Step 3: Create `src/app/editor/layout.tsx`**

Since the editor page is `"use client"`, metadata must be in a separate layout file:

```tsx
import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "Resume Editor",
    description: "Edit your resume with real-time preview and export to PDF",
    robots: {
        index: true,
        follow: true,
    },
};

export default function EditorLayout({children}: {children: React.ReactNode}) {
    return children;
}
```

- [ ] **Step 4: Verify it compiles**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 5: Lint**

Run: `npm run lint:fix`
Expected: No errors (or auto-fixed)

- [ ] **Step 6: Commit**

```bash
git add src/app/editor/page.tsx src/app/editor/layout.tsx
git commit -m "feat: move resume editor to /editor route"
```

---

### Task 6: Rewrite landing page at `/`

**Files:**
- Rewrite: `src/app/page.tsx`

- [ ] **Step 1: Rewrite `src/app/page.tsx` with the landing page**

Replace the entire file with a server-rendered landing page. The page uses lucide-react icons (already a dependency), semantic HTML, and Tailwind CSS matching the existing design system.

```tsx
import type {Metadata} from "next";
import {Eye, FileDown, Sparkles, UserRoundX} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
    alternates: {
        canonical: "https://cv-make.com",
    },
};

const features = [
    {
        icon: Eye,
        title: "Live Preview",
        description: "See changes instantly as you type — no refresh needed",
    },
    {
        icon: FileDown,
        title: "PDF Export",
        description: "Download your resume as a professionally formatted PDF",
    },
    {
        icon: UserRoundX,
        title: "No Account Needed",
        description: "Start building immediately — no registration or email required",
    },
    {
        icon: Sparkles,
        title: "Completely Free",
        description: "All features available at no cost, no hidden fees",
    },
];

const steps = [
    {
        number: 1,
        title: "Fill in Your Details",
        description: "Enter your experience, education, and skills",
    },
    {
        number: 2,
        title: "Preview in Real Time",
        description: "See your resume take shape as you type",
    },
    {
        number: 3,
        title: "Download as PDF",
        description: "Export a professionally formatted PDF ready to send",
    },
];

export default function LandingPage() {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Hero */}
            <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
                <h1 className="text-4xl sm:text-5xl font-bold text-[#111] tracking-tight max-w-2xl">
                    Create Your Professional Resume in Minutes
                </h1>
                <p className="mt-4 text-lg text-[#666] max-w-xl">
                    Free online resume builder with real-time preview and PDF export. No
                    sign-up required.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
                    <Link
                        href="/editor"
                        className="btn-primary text-base px-8 py-3 inline-block"
                    >
                        Start Building
                    </Link>
                    <Link
                        href="/editor"
                        className="text-sm text-[#999] hover:text-[#666] transition-colors"
                    >
                        Continue Editing
                    </Link>
                </div>
            </section>

            {/* Features */}
            <section className="px-6 py-16 bg-white">
                <h2 className="text-2xl font-bold text-[#111] text-center mb-10">
                    Everything You Need
                </h2>
                <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="bg-[#fafafa] rounded-[10px] border border-[#e5e5e5] p-5"
                        >
                            <feature.icon className="w-6 h-6 text-[#111] mb-3" />
                            <h3 className="font-semibold text-[#111] mb-1">{feature.title}</h3>
                            <p className="text-sm text-[#666]">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How It Works */}
            <section className="px-6 py-16">
                <h2 className="text-2xl font-bold text-[#111] text-center mb-10">
                    How It Works
                </h2>
                <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
                    {steps.map((step) => (
                        <div key={step.number}>
                            <div className="w-10 h-10 rounded-full bg-[#111] text-white flex items-center justify-center text-lg font-bold mx-auto mb-3">
                                {step.number}
                            </div>
                            <h3 className="font-semibold text-[#111] mb-1">{step.title}</h3>
                            <p className="text-sm text-[#666]">{step.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* For Developers */}
            <section className="px-6 py-16 bg-white">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-[#111] mb-4">
                        Built for Developers
                    </h2>
                    <p className="text-[#666]">
                        Clean formatting and ATS-friendly output designed for tech
                        professionals. Highlight your skills, projects, and experience with a
                        resume that gets past automated screening systems. Open source on{" "}
                        <a
                            href="https://github.com/misbiheyv/cv-make"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#111] underline hover:text-[#333]"
                        >
                            GitHub
                        </a>
                        .
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-6 py-8 border-t border-[#e5e5e5] text-center text-sm text-[#999]">
                <p>
                    &copy; {new Date().getFullYear()} CV Make &middot;{" "}
                    <a
                        href="https://github.com/misbiheyv/cv-make"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#666] transition-colors"
                    >
                        GitHub
                    </a>
                </p>
            </footer>
        </div>
    );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 3: Lint**

Run: `npm run lint:fix`
Expected: No errors (or auto-fixed)

- [ ] **Step 4: Verify dev server renders correctly**

Run: `npm run dev`
Check: `http://localhost:3000` shows the landing page with all 5 sections.
Check: `http://localhost:3000/editor` shows the resume editor.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(seo): add server-rendered landing page with keyword-rich content"
```

---

### Task 7: Final verification

- [ ] **Step 1: Run full typecheck**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 2: Run linter**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Run unit tests**

Run: `npm run test`
Expected: All tests pass (no existing tests should break — changes are additive/page-level)

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: Successful build with no errors. Confirms all metadata exports, robots, sitemap, and manifest are valid.

- [ ] **Step 5: Spot-check generated output**

After build, verify the generated files exist:
- `.next/server/app/robots.txt` (or served at `/robots.txt`)
- `.next/server/app/sitemap.xml` (or served at `/sitemap.xml`)
- `.next/server/app/manifest.webmanifest` (or served at `/manifest.webmanifest`)

- [ ] **Step 6: Commit any remaining fixes**

If any fixes were needed during verification, stage and commit them:

```bash
git add -A
git commit -m "fix(seo): address issues found during final verification"
```

Only run this step if there were actual fixes. Skip if everything passed clean.
