# Branding & Header Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new document-outline logo, favicon, version badge, and GitHub link to the CV Make sidebar header.

**Architecture:** Replace the existing "CV" text logo with an inline SVG icon. Expose the app version from `package.json` via `next.config.ts` env var. Add version badge and GitHub icon to the right side of the sidebar header. Create SVG and ICO favicons in `public/`.

**Tech Stack:** Next.js 15 metadata API, Tailwind CSS 4, lucide-react (Github icon), inline SVG

---

### Task 1: Expose app version via next.config.ts

**Files:**
- Modify: `next.config.ts:1-11`

- [ ] **Step 1: Update next.config.ts to expose NEXT_PUBLIC_APP_VERSION**

Read the version from `package.json` and inject it as a public env var so the client can access it at build time.

```ts
import type { NextConfig } from 'next';

const { version } = require('./package.json');

const nextConfig: NextConfig = {
  serverExternalPackages: ['puppeteer'],
  output: 'standalone',
  turbopack: {
    root: process.cwd(),
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
};

export default nextConfig;
```

- [ ] **Step 2: Verify the build still works**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat: expose app version as NEXT_PUBLIC_APP_VERSION"
```

---

### Task 2: Create favicon files

**Files:**
- Create: `public/favicon.svg`
- Create: `public/favicon.ico`
- Modify: `src/app/layout.tsx:1-19`

- [ ] **Step 1: Create the SVG favicon**

Create `public/favicon.svg` with the document-outline icon on a black rounded-square background:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="6" fill="#111"/>
  <path d="M7 5 H20 L25 10 V27 H7 Z" stroke="white" stroke-width="2.5" stroke-linejoin="round" fill="none"/>
  <line x1="10" y1="15" x2="22" y2="15" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <line x1="10" y1="19.5" x2="18" y2="19.5" stroke="white" stroke-width="2" stroke-linecap="round"/>
</svg>
```

- [ ] **Step 2: Generate the ICO favicon**

Convert the SVG to a 32x32 ICO file. Use the `sips` (macOS built-in) + `iconutil` approach, or create a minimal PNG-based ICO:

```bash
# Install sharp-cli if not available, or use an alternative approach
# For simplicity, we'll create a simple favicon.ico from the SVG using the system tools

# First, convert SVG to PNG using sips (macOS)
# Since sips doesn't handle SVG, we'll use a different approach:
# Create a minimal 32x32 ICO manually using the Next.js built-in favicon support

# Actually, Next.js will use the SVG favicon for modern browsers.
# For the ICO fallback, we can use a simple approach:
npx sharp-cli --input public/favicon.svg --output public/favicon.png resize 32 32 2>/dev/null || echo "Will create ICO manually"
```

If automated conversion is not available, create a minimal `public/favicon.ico` by:
1. Opening `public/favicon.svg` in a browser
2. Taking a 32x32 screenshot
3. Converting to ICO using any online tool

Alternatively, skip the ICO file — modern browsers all support SVG favicons, and Next.js serves `favicon.svg` correctly. The ICO is optional.

- [ ] **Step 3: Update layout.tsx metadata to include favicon**

```tsx
import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
	title: 'CV Make',
	description: 'Create professional resumes with ease',
	icons: {
		icon: [
			{ url: '/favicon.svg', type: 'image/svg+xml' },
		],
	},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className="antialiased">
				{children}
				<Toaster position="top-right" richColors />
			</body>
		</html>
	);
}
```

- [ ] **Step 4: Verify favicon appears in the browser**

Run: `npm run dev`
Open `http://localhost:3000` and check the browser tab for the favicon.
Expected: The document-outline icon appears in the browser tab.

- [ ] **Step 5: Commit**

```bash
git add public/favicon.svg src/app/layout.tsx
git commit -m "feat: add SVG favicon with document-outline icon"
```

---

### Task 3: Update sidebar header with new logo, version badge, and GitHub link

**Files:**
- Modify: `src/components/Sidebar.tsx:1-102`

- [ ] **Step 1: Update the Sidebar component**

Replace the entire header section (lines 70-78) and add the Github import from lucide-react. Here is the full updated file:

```tsx
'use client';

import { Github } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { EducationForm } from './forms/EducationForm';
import { LanguagesForm } from './forms/LanguagesForm';
import { PersonalInfoForm } from './forms/PersonalInfoForm';
import { SkillsForm } from './forms/SkillsForm';
import { WorkExperienceForm } from './forms/WorkExperienceForm';
import { SectionTabs } from './ui/SectionTabs';

const TABS = [
	{ id: 'personal', label: 'Personal' },
	{ id: 'experience', label: 'Experience' },
	{ id: 'education', label: 'Education' },
	{ id: 'skills', label: 'Skills' },
	{ id: 'languages', label: 'Languages' },
];

const TAB_CONTENT: Record<string, React.ReactNode> = {
	personal: <PersonalInfoForm />,
	experience: <WorkExperienceForm />,
	education: <EducationForm />,
	skills: <SkillsForm />,
	languages: <LanguagesForm />,
};

const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0';

export function Sidebar() {
	const [width, setWidth] = useState(550);
	const [isResizing, setIsResizing] = useState(false);
	const [activeTab, setActiveTab] = useState('personal');
	const sidebarRef = useRef<HTMLDivElement>(null);

	const startResizing = () => {
		setIsResizing(true);
	};

	useEffect(() => {
		const stopResizing = () => {
			setIsResizing(false);
		};

		const resize = (e: MouseEvent) => {
			const newWidth = e.clientX;
			if (newWidth >= 400 && newWidth <= 800) {
				setWidth(newWidth);
			}
		};

		if (isResizing) {
			document.body.style.userSelect = 'none';
			window.addEventListener('mousemove', resize);
			window.addEventListener('mouseup', stopResizing);
		} else {
			document.body.style.userSelect = '';
		}

		return () => {
			document.body.style.userSelect = '';
			window.removeEventListener('mousemove', resize);
			window.removeEventListener('mouseup', stopResizing);
		};
	}, [isResizing]);

	return (
		<aside
			ref={sidebarRef}
			style={{ width: `${width}px`, minWidth: `${width}px` }}
			className="h-screen flex flex-col border-r border-[#e5e5e5] bg-white relative"
		>
			{/* Header */}
			<div className="px-5 py-4 border-b border-[#f0f0f0]">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="w-6 h-6 bg-[#111] rounded-md flex items-center justify-center">
							<svg
								width="14"
								height="14"
								viewBox="0 0 28 28"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M5 3 H18 L23 8 V25 H5 Z"
									stroke="white"
									strokeWidth="2.5"
									strokeLinejoin="round"
								/>
								<line
									x1="8"
									y1="13"
									x2="20"
									y2="13"
									stroke="white"
									strokeWidth="2"
									strokeLinecap="round"
								/>
								<line
									x1="8"
									y1="17.5"
									x2="16"
									y2="17.5"
									stroke="white"
									strokeWidth="2"
									strokeLinecap="round"
								/>
							</svg>
						</div>
						<span className="text-[15px] font-bold text-[#111] tracking-tight">
							CV Make
						</span>
					</div>
					<div className="flex items-center gap-2.5">
						<span className="text-[10px] text-[#999] bg-[#f5f5f5] px-1.5 py-0.5 rounded">
							v{appVersion}
						</span>
						<a
							href="https://github.com/misbiheyv/cv-make"
							target="_blank"
							rel="noopener noreferrer"
							className="text-[#666] hover:text-[#111] transition-colors"
							aria-label="GitHub repository"
						>
							<Github size={18} />
						</a>
					</div>
				</div>
			</div>

			{/* Tab navigation */}
			<SectionTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

			{/* Form content */}
			<div className="flex-1 overflow-y-auto px-5 py-4">{TAB_CONTENT[activeTab]}</div>

			{/* Resize Handle */}
			{/* biome-ignore lint/a11y/useSemanticElements: resize handle requires custom div */}
			<div
				role="separator"
				tabIndex={0}
				aria-orientation="vertical"
				aria-valuenow={width}
				aria-valuemin={400}
				aria-valuemax={800}
				aria-label="Resize sidebar"
				onMouseDown={startResizing}
				className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-blue-500 transition-colors"
				style={{ touchAction: 'none' }}
			/>
		</aside>
	);
}
```

Key changes from the original:
- Added `import { Github } from 'lucide-react'` at the top
- Added `const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0'` before the component
- Replaced the `<span>` "CV" text with the inline SVG document-outline icon
- Changed the header's inner div to `justify-between` to push the right group to the edge
- Added a right-side group with version badge and GitHub link

- [ ] **Step 2: Run the linter**

Run: `npm run lint`
Expected: No new lint errors.

- [ ] **Step 3: Run the typecheck**

Run: `npm run typecheck`
Expected: No type errors.

- [ ] **Step 4: Verify visually in the browser**

Run: `npm run dev`
Open `http://localhost:3000` and verify:
1. The sidebar header shows the document-outline icon (white on black) instead of "CV" text
2. "CV Make" text is still visible next to the icon
3. A small gray `v0.1.0` badge appears on the right side of the header
4. A GitHub icon appears to the right of the version badge
5. Clicking the GitHub icon opens `https://github.com/misbiheyv/cv-make` in a new tab
6. Hovering over the GitHub icon changes its color from gray to black

- [ ] **Step 5: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: update sidebar header with new logo, version badge, and GitHub link"
```
