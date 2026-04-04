# Design: Match LaTeX Resume Template Styling

**Date**: 2026-04-04
**Scope**: CSS styling changes + minor template adjustment to match the Jake Gutierrez LaTeX resume template

## Goal

Update the resume template's CSS and one template rendering detail to visually match the [Jake Gutierrez LaTeX resume template](https://github.com/sb2nov/resume). No data model or form changes.

## Decisions

- **Paper size**: US Letter (215.9mm x 279.4mm)
- **Header**: Keep border-bottom and summary section (divergence from LaTeX template)
- **Skills**: Keep current flexbox tag layout (divergence from LaTeX template)
- **Projects section**: Not adding (out of scope)
- **Education rows**: Swap to match LaTeX (institution on row 1, degree on row 2)

## Files to Change

1. `src/templates/resumeStyles.ts` — CSS styling
2. `src/templates/ResumeTemplate.tsx` — Education row order swap

## Detailed Changes

### 1. Page Layout

| Property | Current | Target |
|----------|---------|--------|
| Width | 210mm (A4) | 215.9mm (Letter) |
| Min-height | 297mm (A4) | 279.4mm (Letter) |
| Padding | 5mm 10mm | 12.7mm (0.5in) all sides |
| Line-height | 1.4 | 1.15 |
| Font | CMU Serif | CMU Serif (no change) |
| Font size | 11pt | 11pt (no change) |

### 2. Header

| Property | Current | Target |
|----------|---------|--------|
| Name font-variant | none | small-caps |
| Name font-size | 24pt | 24pt (no change) |
| Border-bottom | 1px solid #000 | Keep (user preference) |
| Margin-bottom | 12px | 8px |
| Padding-bottom | 12px | 8px |
| Contact color | #333 | #000 (match body text) |

### 3. Section Titles

| Property | Current | Target |
|----------|---------|--------|
| text-transform | uppercase | none |
| font-variant | none | small-caps |
| font-size | 12pt | 12pt (no change, close to LaTeX `\large`) |
| margin-bottom (section) | 12px | 6px |
| margin (title) | 0 0 8px 0 | 0 0 4px 0 |
| letter-spacing | 0.5px | 0 |

### 4. Experience Items

| Property | Current | Target |
|----------|---------|--------|
| margin-bottom | 10px | 5px |
| item-date font-style | italic | normal |
| item-date font-size | 10pt | 10pt (no change) |
| item-subtitle font-size | inherited | 10pt (small) |
| item-subtitle margin-bottom | 4px | 2px |

### 5. Education Items (Template Change in ResumeTemplate.tsx)

Current order:
- Row 1: degree (bold) + dates (italic)
- Row 2: institution (italic) + location (italic)

New order:
- Row 1: institution (bold) + location (normal)
- Row 2: degree (italic, small) + dates (italic, small)

### 6. Bullets

| Property | Current | Target |
|----------|---------|--------|
| margin-left | 18px | 18px (no change) |
| marker size | default | smaller (font-size: 0.6em on ::marker) |
| li margin-bottom | 2px | 1px |

### 7. Unchanged

- Summary section: kept as-is
- Skills section: kept as flexbox tags
- Languages section: kept as-is
- Empty state: kept as-is

## What This Does NOT Change

- Data model (`src/types/resume.ts`)
- Form components (`src/components/forms/`)
- Store (`src/store/useResumeStore.ts`)
- PDF generation pipeline (`src/app/api/pdf/route.tsx`, `src/lib/`)
- No new sections (Projects)
