# Branding & Header Updates Design

## Overview

Add a new icon-based app logo, favicon, version badge, and GitHub link to the CV Make sidebar header.

## Decisions

- **Logo style**: Minimal Outline — black `#111` rounded square with a white document-outline SVG (folded corner + text lines)
- **Placement**: Version badge and GitHub icon on the right side of the existing sidebar header row
- **GitHub link behavior**: Opens in a new tab

## 1. New App Logo

Replace the current "CV" text square in the sidebar header with an SVG icon of a document outline.

**Icon description:**
- Black (`#111`) rounded square container (`w-6 h-6`, `rounded-md`)
- White stroke document with folded top-right corner and two horizontal text lines
- Same icon used at both header size (24px container) and favicon size (16-32px)

**SVG (28x28 viewBox):**
```svg
<svg viewBox="0 0 28 28" fill="none">
  <path d="M5 3 H18 L23 8 V25 H5 Z" stroke="white" stroke-width="2.5" stroke-linejoin="round"/>
  <line x1="8" y1="13" x2="20" y2="13" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <line x1="8" y1="17.5" x2="16" y2="17.5" stroke="white" stroke-width="2" stroke-linecap="round"/>
</svg>
```

## 2. Favicon

- **Primary**: `public/favicon.svg` — the document-outline icon on a black rounded-square background
- **Fallback**: `public/favicon.ico` — 32x32 PNG-based ICO for legacy browsers
- **Metadata**: Update `src/app/layout.tsx` to include favicon in the `metadata` export

## 3. Sidebar Header Changes

Current header structure (left-aligned only):
```
[CV logo] CV Make
```

New header structure:
```
[Doc icon] CV Make                    [v0.1.0] [GitHub icon]
```

**Version badge:**
- Text: `v{version}` from `package.json`
- Style: `text-[10px] text-[#999] bg-[#f5f5f5] px-1.5 py-0.5 rounded`
- Version exposed at build time via `next.config.ts` → `NEXT_PUBLIC_APP_VERSION`

**GitHub icon:**
- Lucide `Github` icon, 18px, color `#666`
- Links to `https://github.com/misbiheyv/cv-make`
- `target="_blank"` + `rel="noopener noreferrer"`
- Hover state: color transitions to `#111`

## 4. Files Changed

| File | Change |
|------|--------|
| `src/components/Sidebar.tsx` | Replace logo SVG, add version badge + GitHub link to header right side |
| `public/favicon.svg` | New file — SVG favicon |
| `public/favicon.ico` | New file — ICO fallback |
| `src/app/layout.tsx` | Add favicon to metadata icons |
| `next.config.ts` | Expose `NEXT_PUBLIC_APP_VERSION` env var from `package.json` version |

## 5. Technical Notes

- Version is read from `package.json` at build time via `next.config.ts` env config, not at runtime
- The SVG icon is inline in the Sidebar component (not a separate file import) for simplicity
- Favicon uses the Next.js metadata API (`icons` field in metadata export)
- No new dependencies needed — `lucide-react` already provides the `Github` icon
