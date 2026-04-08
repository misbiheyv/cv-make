# Google Metrics Integration — Design Spec

**Date:** 2026-04-08
**Scope:** GA4 analytics + Google Search Console verification
**Approach:** Next.js `<Script>` with raw gtag.js (zero dependencies)

## Summary

Add Google Analytics 4 (GA4) for user behavior tracking and Google Search Console (GSC) verification for SEO performance monitoring. No consent banner in this iteration — to be added when the app scales to require GDPR compliance.

## Configuration

Two new environment variables:

| Variable | Purpose | Example |
|---|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 measurement ID | `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_GSC_VERIFICATION` | Search Console verification code | `abc123...` |

Both use the `NEXT_PUBLIC_` prefix for client-side availability. Added to `.env.example` with placeholder values. When not set, analytics features are silently disabled — no errors, no broken pages.

## GA4 Script Loading

### GoogleAnalytics Component

**File:** `src/components/GoogleAnalytics.tsx`

- Reads `NEXT_PUBLIC_GA_MEASUREMENT_ID` from `process.env`
- If missing, renders nothing (returns `null`)
- If present, renders two `<Script>` elements:
  1. gtag.js loader: `https://www.googletagmanager.com/gtag/js?id={GA_ID}` with `strategy="afterInteractive"`
  2. Inline initialization script: creates `dataLayer`, calls `gtag('js', new Date())` and `gtag('config', GA_ID)`

### Placement

Rendered in `src/app/layout.tsx` inside the `<body>` tag. Available on all pages. GA4 automatically tracks page views with App Router client-side navigation.

### Type Safety

**File:** `src/types/gtag.d.ts`

Global type declaration for the `gtag()` function so TypeScript recognizes it when called for custom events.

## Event Tracking

Two custom events, both fired from `src/components/DownloadButton.tsx`:

| Event | When | Payload |
|---|---|---|
| `pdf_download` | Successful PDF download | `{ event_category: 'conversion' }` |
| `pdf_download_error` | Failed PDF download | `{ event_category: 'error' }` |

GA4 handles page view tracking automatically via the `gtag('config', ...)` call. No manual page view events needed.

Events are fired inline with a `typeof gtag !== 'undefined'` guard — no abstraction layer or utility function for two calls. The guard ensures no errors when GA is disabled (env var not set).

## Google Search Console Verification

Uses Next.js metadata API in `src/app/layout.tsx`:

```ts
export const metadata: Metadata = {
  // ...existing metadata
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION,
  },
}
```

Next.js renders this as `<meta name="google-site-verification" content="..." />`. If the env var is missing, the tag is omitted.

## Files Changed

| File | Change |
|---|---|
| `src/components/GoogleAnalytics.tsx` | New — GA4 script loading component |
| `src/types/gtag.d.ts` | New — global gtag type declaration |
| `src/app/layout.tsx` | Add GoogleAnalytics component + GSC verification metadata |
| `src/components/DownloadButton.tsx` | Add gtag event calls on success/failure |
| `.env.example` | Add GA_MEASUREMENT_ID and GSC_VERIFICATION placeholders |
| `tests/unit/google-analytics.test.ts` | New — unit tests for GoogleAnalytics component |

## Testing

### Unit Tests (`tests/unit/google-analytics.test.ts`)

- GoogleAnalytics renders nothing when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is not set
- GoogleAnalytics renders script tags when the measurement ID is present
- Script src contains the correct measurement ID

### DownloadButton Event Test

- Verify `gtag()` is called with `pdf_download` after successful download
- Verify `gtag()` is called with `pdf_download_error` after failed download

### Manual Verification

- GA4 Real-Time dashboard shows page views after deployment
- Search Console accepts verification after meta tag is deployed

## Future Work

- Cookie consent banner for GDPR compliance (when app scales to significant EU traffic)
- Additional event tracking (editor interactions, section usage) if needed
