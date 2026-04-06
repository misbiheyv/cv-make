# CV Make — UI Redesign Spec

## Overview

Full UI redesign of the CV Make resume builder. Replaces the current plain black/white/gray interface with a clean modern SaaS aesthetic (Linear/Notion/Vercel style). Introduces shadcn/ui as a component library. The ResumeTemplate component, Zustand store, and all API routes remain unchanged.

## Layout

### Structure

No top header bar. The page is a full-height two-column layout:

```
┌────────────────────┬─────────────────────────────────────┐
│  [CV] CV Make       │  ·  ·  ·  ·  ·  ·  [Download PDF] │
│                     │  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  · │
│  [Personal] [Exp]   │  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  · │
│  [Edu] [Skills]     │  ·  ·  ┌──────────────┐  ·  ·  · │
│  [Languages]        │  ·  ·  │              │  ·  ·  · │
│                     │  ·  ·  │   Resume     │  ·  ·  · │
│  ┌──────────────┐   │  ·  ·  │   Preview    │  ·  ·  · │
│  │ Full Name    │   │  ·  ·  │              │  ·  ·  · │
│  └──────────────┘   │  ·  ·  │              │  ·  ·  · │
│  ┌──────┐ ┌──────┐  │  ·  ·  └──────────────┘  ·  ·  · │
│  │Phone │ │City  │  │  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  · │
│  └──────┘ └──────┘  │  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  · │
│                     │                                     │
│  ┌──────────────┐   │                                     │
│  │ Summary      │   │                                     │
│  └──────────────┘  ▐│                                     │
└────────────────────┴─────────────────────────────────────┘
```

### Sidebar (Left)

- **Header:** Logo icon (24x24 dark rounded square with "CV" text) + "CV Make" text. No other controls.
- **Tab navigation:** Pill-style tabs below header. 5 tabs: Personal, Experience, Education, Skills, Languages. Active tab: `bg-#111 text-white`, inactive: `bg-#f5f5f5 text-#666`. Tabs wrap to second line if sidebar is narrow.
- **Form content:** Scrollable area below tabs showing the active section's form.
- **Resizable:** Drag handle on right edge (visible 4px-wide bar with a subtle 32px-tall gray indicator at vertical center). Width range: 400–800px, default 550px. Current resize logic is preserved.
- **Background:** White. Right border: 1px solid `#e5e5e5`.

### Preview Area (Right)

- **Background:** Light gray `#f3f3f3` with dot-grid pattern via CSS `radial-gradient(circle, #d5d5d5 0.8px, transparent 0.8px)` with `background-size: 16px 16px`.
- **Resume:** Centered white A4 container with `box-shadow: 0 4px 24px rgba(0,0,0,0.08)`. Uses existing `ResumePreview` component wrapping `ResumeTemplate` — no changes to template internals.
- **Download button:** Floating in top-right corner of preview area. Dark (`#111`) rounded button with download icon + "Download PDF" text. Shows loading state during generation.

## Form Design

### Input Style

All text inputs and textareas use the subtle bordered style:

- **Border:** 1px solid `#e0e0e0`
- **Border radius:** 8px (use shadcn default `rounded-lg`)
- **Padding:** 10px 14px
- **Font size:** 14px (same as current)
- **Focus state:** Border darkens to `#111` with `box-shadow: 0 0 0 1px #111`
- **Placeholder:** Color `#aaa`

### Labels

- Font size: 11px (shadcn `text-xs` with `font-medium`)
- Color: `#888`
- Position: Above the input with 5px margin-bottom

### Grid Layouts

Related fields use a flex row with 12px gap:
- Personal: Phone + City (2 cols), Full Name (full width), Links (full width), Summary (full width)
- Experience: Title + Company (2 cols), Location + Start + End (3 cols)
- Education: Degree + Institution (2 cols), Location + Start + End (3 cols)

### Buttons

- **Add buttons (dashed):** Full-width, `border: 1px dashed #ddd`, `border-radius: 10px`, text color `#999`, centered text with "+" prefix. Used for "Add Experience", "Add Education", "Add Skill", "Add Language", "Add link", "Add bullet".
- **Download button:** `bg-#111 text-white`, `border-radius: 8px`, `padding: 8px 20px`, with subtle box-shadow. Loading state shows spinner + "Generating..." text.
- **Delete buttons (×):** Ghost style, color `#ddd`, hover `#ef4444`. Size: 28px touch target.
- **Move buttons (▲▼):** Ghost style, color `#ccc`, hover `#666`. Arranged vertically. Disabled state: `opacity: 0.3`.

## Section-Specific Forms

### Personal Info Tab

Fields: Full Name (full width), Phone + City (2 cols), Links (reorderable list), Summary (textarea, min-height 80px).

Links list: Each link is a row with [move arrows] [text input] [× delete]. "Add link" dashed button below.

### Experience Tab

List of collapsible SectionCards. Each card:
- **Header:** Light gray background (`#fafafa`), shows collapse chevron + "Job Title @ Company" (auto-generated from fields). Right side: move arrows + × delete.
- **Body (when expanded):** Title + Company (2 cols), Location + Start + End (3 cols), Bullet points (reorderable textarea list with "Add bullet" dashed button).
- **"Add Experience"** dashed button below all cards.

### Education Tab

List of SectionCards (non-collapsible). Each card:
- **Header:** Shows "Degree" text or "Education #N" if empty. Right side: move arrows + × delete.
- **Body:** Degree + Institution (2 cols), Location + Start + End (3 cols), Description (textarea, min-height 40px).
- **"Add Education"** dashed button below.

### Skills Tab

Compact row layout (no cards). Each skill:
- Row: [move arrows] [name input, ~100px] [description input, flex-1] [× delete]
- **"Add Skill"** dashed button below.

### Languages Tab

Compact row layout (no cards). Each language:
- Row: [move arrows] [name input, flex-1] [level input, flex-1] [× delete]
- **"Add Language"** dashed button below.

## Error Handling

Toast notifications using shadcn's Sonner integration, floating over the preview area:

- **Position:** Top-right of viewport (Sonner default `position="top-right"`). The `Toaster` component is placed in the root layout.
- **Auto-dismiss:** 5 seconds for generic errors, persistent for rate-limit (shows retry-after countdown)
- **Styles by type:**
  - Rate limit (429): Yellow/amber theme with clock icon
  - Timeout (504): Orange theme
  - Validation (400): Red theme
  - Generic error: Red theme with alert icon
- **Dismissible:** × button on each toast

## Component Library: shadcn/ui

### Components to Install

- `input` — form text inputs
- `textarea` — form textareas
- `button` — all buttons (download, add, delete, move)
- `tabs` — section navigation in sidebar
- `sonner` — toast notifications

### Theme Customization

Override shadcn CSS variables to match the design:
- `--radius: 0.5rem` (8px border radius)
- `--primary: #111` (near-black)
- `--primary-foreground: #fff`
- `--muted: #f5f5f5`
- `--muted-foreground: #666`
- `--border: #e0e0e0`
- `--input: #e0e0e0`
- `--ring: #111`

### Migration Strategy

Replace custom UI components one-by-one with shadcn equivalents:
- `FormField` → shadcn `Input` / `Textarea` + custom `Label`
- `Accordion` → removed (replaced by `Tabs`)
- `AddButton` → shadcn `Button` with `variant="outline"` + dashed border class
- `IconButton` → shadcn `Button` with `variant="ghost"` + `size="icon"`
- `MoveButtons` → keep custom (thin wrapper around two shadcn icon buttons)
- `SectionCard` → keep custom (shadcn doesn't have a direct equivalent)
- `ReorderableList` → keep custom
- `EmptyState` → keep custom (simple component)

## What Does NOT Change

- `src/templates/basicTemplate/ResumeTemplate.tsx` — resume content/styling
- `src/templates/basicTemplate/resumeStyles.ts` — resume CSS
- `src/store/useResumeStore.ts` — state management
- `src/app/api/*` — all API routes
- `src/lib/*` — all utilities (logger, metrics, browserPool)
- `tests/*` — test structure (tests may need minor selector updates)
- Docker/Nginx/deployment configuration
