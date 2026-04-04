# LaTeX Template Styling Match - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update CSS styles and education row order to visually match the Jake Gutierrez LaTeX resume template.

**Architecture:** Two files change: `resumeStyles.ts` gets CSS property updates (page size, margins, spacing, typography), and `ResumeTemplate.tsx` swaps the education section's row order so institution is on row 1 and degree on row 2.

**Tech Stack:** CSS (template string in TypeScript), React/JSX

---

## File Map

- **Modify:** `src/templates/resumeStyles.ts` — All CSS property changes (page layout, header, sections, items, bullets)
- **Modify:** `src/templates/ResumeTemplate.tsx:72-86` — Swap education row order

---

### Task 1: Update page layout and global CSS

**Files:**
- Modify: `src/templates/resumeStyles.ts:13-27`

- [ ] **Step 1: Update container line-height**

In `src/templates/resumeStyles.ts`, change the `.resume-container` rule:

```css
.resume-container {
  font-family: 'CMU Serif';
  font-size: 11pt;
  line-height: 1.15;
  color: #000;
  background: #fff;
}
```

Change `line-height: 1.4` → `line-height: 1.15`.

- [ ] **Step 2: Update page dimensions and margins**

In the same file, change the `.resume-container .resume` rule:

```css
.resume-container .resume {
  width: 215.9mm;
  min-height: 279.4mm;
  padding: 12.7mm;
  margin: 0 auto;
  background: #fff;
}
```

Changes:
- `width: 210mm` → `width: 215.9mm`
- `min-height: 297mm` → `min-height: 279.4mm`
- `padding: 5mm 10mm` → `padding: 12.7mm`

- [ ] **Step 3: Commit**

```bash
git add src/templates/resumeStyles.ts
git commit -m "style: update page to US Letter size with LaTeX-matching margins"
```

---

### Task 2: Update header CSS

**Files:**
- Modify: `src/templates/resumeStyles.ts:29-46`

- [ ] **Step 1: Tighten header spacing**

Change the `.resume-container .header` rule:

```css
.resume-container .header {
  text-align: center;
  margin-bottom: 8px;
  border-bottom: 1px solid #000;
  padding-bottom: 8px;
}
```

Changes:
- `margin-bottom: 12px` → `margin-bottom: 8px`
- `padding-bottom: 12px` → `padding-bottom: 8px`

- [ ] **Step 2: Add small-caps to name**

Change the `.resume-container .name` rule:

```css
.resume-container .name {
  font-size: 24pt;
  font-weight: bold;
  font-variant: small-caps;
  margin: 0 0 6px 0;
  letter-spacing: 1px;
}
```

Add `font-variant: small-caps;` (new line after `font-weight: bold;`).

- [ ] **Step 3: Fix contact info color**

Change the `.resume-container .contact-info` rule:

```css
.resume-container .contact-info {
  font-size: 10pt;
  color: #000;
}
```

Change `color: #333` → `color: #000`.

- [ ] **Step 4: Commit**

```bash
git add src/templates/resumeStyles.ts
git commit -m "style: update header to match LaTeX template typography"
```

---

### Task 3: Update section titles CSS

**Files:**
- Modify: `src/templates/resumeStyles.ts:57-69`

- [ ] **Step 1: Update section margin**

Change the `.resume-container .section` rule:

```css
.resume-container .section {
  margin-bottom: 6px;
}
```

Change `margin-bottom: 12px` → `margin-bottom: 6px`.

- [ ] **Step 2: Update section title to small-caps**

Change the `.resume-container .section-title` rule:

```css
.resume-container .section-title {
  font-size: 12pt;
  font-weight: bold;
  font-variant: small-caps;
  border-bottom: 1px solid #000;
  margin: 0 0 4px 0;
  padding-bottom: 2px;
}
```

Changes:
- Remove `text-transform: uppercase;`
- Add `font-variant: small-caps;`
- `margin: 0 0 8px 0` → `margin: 0 0 4px 0`
- Remove `letter-spacing: 0.5px;`

- [ ] **Step 3: Commit**

```bash
git add src/templates/resumeStyles.ts
git commit -m "style: update section titles to small-caps with tighter spacing"
```

---

### Task 4: Update experience/education items and bullets CSS

**Files:**
- Modify: `src/templates/resumeStyles.ts:71-107`

- [ ] **Step 1: Tighten item spacing**

Change the `.resume-container .experience-item, .resume-container .education-item` rule:

```css
.resume-container .experience-item,
.resume-container .education-item {
  margin-bottom: 5px;
}
```

Change `margin-bottom: 10px` → `margin-bottom: 5px`.

- [ ] **Step 2: Remove italic from date**

Change the `.resume-container .item-date` rule:

```css
.resume-container .item-date {
  font-size: 10pt;
}
```

Remove `font-style: italic;`.

- [ ] **Step 3: Update subtitle sizing and spacing**

Change the `.resume-container .item-subtitle` rule:

```css
.resume-container .item-subtitle {
  display: flex;
  justify-content: space-between;
  font-style: italic;
  font-size: 10pt;
  margin-bottom: 2px;
}
```

Changes:
- Add `font-size: 10pt;`
- `margin-bottom: 4px` → `margin-bottom: 2px`

- [ ] **Step 4: Update bullet marker size and spacing**

Change the `.resume-container .bullets li` rule:

```css
.resume-container .bullets li {
  margin-bottom: 1px;
  text-align: justify;
}
```

Change `margin-bottom: 2px` → `margin-bottom: 1px`.

Then add a new rule right after `.resume-container .bullets li`:

```css
.resume-container .bullets li::marker {
  font-size: 0.6em;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/templates/resumeStyles.ts
git commit -m "style: tighten item spacing and bullet markers to match LaTeX"
```

---

### Task 5: Swap education row order in template

**Files:**
- Modify: `src/templates/ResumeTemplate.tsx:72-86`

- [ ] **Step 1: Swap education rows**

In `src/templates/ResumeTemplate.tsx`, find the Education mapping block (lines 72-88) and replace it with:

```tsx
            <div key={edu.id} className="education-item">
              <div className="item-header">
                <span className="item-title">
                  {edu.institution || (showPlaceholders ? 'Institution' : '')}
                </span>
                <span className="item-date">
                  {edu.location}
                </span>
              </div>
              <div className="item-subtitle">
                <span>{edu.degree || (showPlaceholders ? 'Degree' : '')}</span>
                <span>
                  {edu.startDate || (showPlaceholders ? 'Start' : '')} -{' '}
                  {edu.endDate || (showPlaceholders ? 'End' : '')}
                </span>
              </div>
              {edu.description && <p>{edu.description}</p>}
            </div>
```

Changes:
- Row 1 (`item-header`): now shows **institution** (bold, left) and **location** (right)
- Row 2 (`item-subtitle`): now shows **degree** (italic, left) and **dates** (italic, right)
- Previously: row 1 was degree+dates, row 2 was institution+location

- [ ] **Step 2: Commit**

```bash
git add src/templates/ResumeTemplate.tsx
git commit -m "style: swap education rows to match LaTeX template layout"
```

---

### Task 6: Visual verification

- [ ] **Step 1: Start dev server and verify**

```bash
cd /Users/misbiheyv/resume && npm run dev
```

Open the app in browser. Check:
1. Page is US Letter sized (slightly wider and shorter than before)
2. Name has small-caps styling
3. Contact info is black (not gray)
4. Section titles use small-caps (not ALL CAPS)
5. Section title spacing is tighter
6. Experience items: date on row 1 is NOT italic, subtitle row is italic and small
7. Education items: institution+location on row 1 (bold), degree+dates on row 2 (italic)
8. Bullet markers are smaller
9. Overall spacing is tighter throughout

- [ ] **Step 2: Test PDF generation**

Click the download/PDF button. Verify the generated PDF matches the preview — same layout, same spacing, same typography.
