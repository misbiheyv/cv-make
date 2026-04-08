# SEO Improvements Design Spec

**Date:** 2026-04-08
**Domain:** cv-make.com
**Approach:** Next.js 15 built-in metadata API, no new dependencies

## Overview

Improve SEO for CV Make through enhanced metadata, search engine files, structured data, a web app manifest, and a new landing page. The current single-page client-side editor provides minimal indexable content. This spec adds a server-rendered landing page at `/` and moves the editor to `/editor`.

## 1. Enhanced Metadata (`src/app/layout.tsx`)

Expand the existing `metadata` export:

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
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};
```

### JSON-LD Structured Data

Add a `<script type="application/ld+json">` in `layout.tsx` body (as a React component or inline):

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "CV Make",
  "url": "https://cv-make.com",
  "description": "Free online resume builder with real-time preview and PDF export",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "browserRequirements": "Requires a modern web browser"
}
```

## 2. `src/app/robots.ts` (New File)

```ts
import type { MetadataRoute } from "next";

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

## 3. `src/app/sitemap.ts` (New File)

```ts
import type { MetadataRoute } from "next";

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

No `changeFrequency` — modern crawlers ignore it.

## 4. `src/app/manifest.ts` (New File)

```ts
import type { MetadataRoute } from "next";

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

Colors match the existing design: `bg-gray-50` (#f9fafb) for background, `#111` for the primary dark color used throughout the app.

## 5. Landing Page (`src/app/page.tsx` — Rewrite)

Server-rendered page replacing the current client-side editor at `/`. The page uses semantic HTML elements and Tailwind CSS consistent with the existing design system (`.btn-primary`, `#111` dark, `#f9fafb` background).

### Page-specific metadata

```ts
export const metadata: Metadata = {
  title: "CV Make — Free Online Resume Builder",
  alternates: {
    canonical: "https://cv-make.com",
  },
};
```

### Sections

#### 5a. Hero

- Headline: `<h1>` — "Create Your Professional Resume in Minutes"
- Subtext: Brief paragraph mentioning key value props (free, no sign-up, PDF export, real-time preview)
- Primary CTA: "Start Building" link to `/editor` using `btn-primary` styling
- Secondary link: "Continue Editing" shown for context (always visible as a subtle link; localStorage detection is client-side and out of scope for the server-rendered page — this can be enhanced later)

#### 5b. Features Grid (4 cards)

Cards use a layout consistent with the existing `.section-card` pattern. Each card has an icon (from lucide-react, already a dependency), a title, and a one-line description.

| Feature | Title | Description |
|---------|-------|-------------|
| Real-time Preview | Live Preview | See changes instantly as you type — no refresh needed |
| PDF Export | PDF Export | Download your resume as a professionally formatted PDF |
| No Sign-up | No Account Needed | Start building immediately — no registration or email required |
| Free Forever | Completely Free | All features available at no cost, no hidden fees |

#### 5c. How It Works (3 steps)

Numbered steps in a horizontal row:

1. **Fill in Your Details** — Enter your experience, education, and skills
2. **Preview in Real Time** — See your resume take shape as you type
3. **Download as PDF** — Export a professionally formatted PDF ready to send

#### 5d. For Developers Section

A short section targeting developer keywords:

- Title: "Built for Developers"
- Content: 1-2 sentences about clean formatting, ATS-friendly output, tech-focused resume sections (skills, projects). Mentions it's open-source with a link to GitHub.

#### 5e. Footer

- App name + copyright
- GitHub link (same repo link used in Sidebar: `https://github.com/misbiheyv/cv-make`)

## 6. Move Editor to `/editor`

### `src/app/editor/page.tsx` (New File)

Move current `src/app/page.tsx` content here:

```tsx
"use client";

import { ResumePreview } from "@/components/ResumePreview";
import { Sidebar } from "@/components/Sidebar";

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

### Page-specific metadata

Add a `metadata` export in a separate `layout.tsx` or use `generateMetadata` — since the page is `"use client"`, metadata goes in `src/app/editor/layout.tsx`:

```ts
export const metadata: Metadata = {
  title: "Resume Editor",
  description: "Edit your resume with real-time preview and export to PDF",
  robots: {
    index: true,
    follow: true,
  },
};
```

## 7. Internal Link Updates

### Sidebar (`src/components/Sidebar.tsx`)

No changes needed — the Sidebar is only rendered inside the editor and doesn't link back to `/`. The GitHub link remains as-is.

### Any other internal navigation

Check for hardcoded links to `/` that should now point to `/editor`. Based on current codebase review, no other internal links exist that need updating.

## Files Changed

| File | Action |
|------|--------|
| `src/app/layout.tsx` | Edit — enhanced metadata + JSON-LD |
| `src/app/page.tsx` | Rewrite — landing page |
| `src/app/editor/page.tsx` | New — editor moved here |
| `src/app/editor/layout.tsx` | New — editor-specific metadata |
| `src/app/robots.ts` | New |
| `src/app/sitemap.ts` | New |
| `src/app/manifest.ts` | New |

## Dependencies

None. All features use Next.js 15 built-in APIs and existing project dependencies (lucide-react for icons, Tailwind CSS for styling).

## Out of Scope

- OG image generation (can be added later)
- Internationalization / hreflang tags
- Additional pages beyond landing and editor
- Analytics / search console integration
- Client-side "Continue Editing" detection based on localStorage (enhancement for later)
