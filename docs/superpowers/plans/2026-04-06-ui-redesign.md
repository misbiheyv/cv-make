# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the CV Make UI with a clean modern SaaS aesthetic — new layout (sidebar-integrated, no header bar), pill-tab navigation, restyled form components, dot-grid preview background, and Sonner toast notifications.

**Architecture:** Remove the Header component and merge its download/error logic into the preview area. Replace the Accordion-based sidebar navigation with a pill-tab switcher that shows one section at a time. Restyle all existing UI components (inputs, buttons, cards) with updated borders, padding, and colors. Add Sonner for toast notifications.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, Sonner (toast), Lucide icons

---

## File Map

### Files to Create
- `src/components/ui/SectionTabs.tsx` — pill-tab navigation component
- `src/components/DownloadButton.tsx` — floating download button with toast errors

### Files to Modify
- `src/app/globals.css` — update all component classes to match new design
- `src/app/page.tsx` — remove Header, restructure layout
- `src/app/layout.tsx` — add Sonner `<Toaster />`
- `src/components/Sidebar.tsx` — replace Accordion with SectionTabs, update header
- `src/components/ResumePreview.tsx` — dot-grid background, integrate DownloadButton
- `src/components/ui/FormField.tsx` — restyle with new label/input treatment
- `src/components/ui/AddButton.tsx` — restyle both variants to dashed style
- `src/components/ui/IconButton.tsx` — update color tokens
- `src/components/ui/MoveButtons.tsx` — update color tokens
- `src/components/ui/SectionCard.tsx` — restyle header with fafafa background
- `src/components/ui/index.ts` — swap Accordion export for SectionTabs

### Files to Delete
- `src/components/ui/Accordion.tsx` — replaced by SectionTabs
- `src/components/Header.tsx` — logic moves to DownloadButton + Sonner toasts

### Files Unchanged
- `src/templates/basicTemplate/*` — resume template untouched
- `src/store/useResumeStore.ts` — state unchanged
- `src/app/api/*` — API routes unchanged
- `src/lib/*` — utilities unchanged
- `src/components/ui/ReorderableList.tsx` — no changes needed
- `src/components/ui/EmptyState.tsx` — no changes needed
- `src/components/forms/*` — form components get restyled via CSS class changes only (no code changes needed since they use `.form-input` and `.form-label` classes)

---

### Task 1: Install Sonner and Update Global Styles

**Files:**
- Modify: `package.json` (add sonner dependency)
- Modify: `src/app/globals.css` (restyle all component classes)

- [ ] **Step 1: Install sonner**

Run: `npm install sonner`

- [ ] **Step 2: Update globals.css with new design tokens**

Replace the full contents of `src/app/globals.css` with:

```css
@import "tailwindcss";

@layer base {
	html {
		font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	}

	body {
		@apply bg-gray-50 text-gray-900;
	}

	button {
		@apply cursor-pointer;
	}
}

@layer components {
	.form-input {
		@apply w-full px-3.5 py-2.5 border border-[#e0e0e0] rounded-lg text-sm
		focus:outline-none focus:border-[#111] focus:shadow-[0_0_0_1px_#111]
		transition-colors duration-200 placeholder:text-[#aaa];
	}

	.form-label {
		@apply block text-xs font-medium text-[#888] mb-1.5;
	}

	.btn-primary {
		@apply px-5 py-2 bg-[#111] text-white rounded-lg hover:bg-[#333]
		transition-colors duration-200 font-medium shadow-sm;
	}

	.btn-secondary {
		@apply w-full py-2.5 bg-transparent text-[#999] border border-dashed border-[#ddd]
		rounded-[10px] hover:border-[#bbb] hover:text-[#666] transition-colors duration-200
		flex items-center justify-center gap-2 text-sm;
	}

	.section-card {
		@apply bg-white rounded-[10px] border border-[#e5e5e5] mb-3 overflow-hidden;
	}

	.section-card-header {
		@apply px-3.5 py-2.5 bg-[#fafafa] border-b border-[#eee]
		flex justify-between items-center;
	}

	.section-card-body {
		@apply p-3.5;
	}
}
```

- [ ] **Step 3: Verify styles compile**

Run: `npm run build`
Expected: Build succeeds (warnings about unused classes are OK at this stage)

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/app/globals.css
git commit -m "style: update global CSS with new design tokens and install sonner"
```

---

### Task 2: Create SectionTabs Component

**Files:**
- Create: `src/components/ui/SectionTabs.tsx`
- Modify: `src/components/ui/index.ts` (add export)

- [ ] **Step 1: Create SectionTabs component**

Create `src/components/ui/SectionTabs.tsx`:

```tsx
'use client';

interface Tab {
	id: string;
	label: string;
}

interface SectionTabsProps {
	tabs: Tab[];
	activeTab: string;
	onTabChange: (tabId: string) => void;
}

export function SectionTabs({ tabs, activeTab, onTabChange }: SectionTabsProps) {
	return (
		<div className="flex flex-wrap gap-1 px-4 py-3">
			{tabs.map((tab) => (
				<button
					key={tab.id}
					type="button"
					onClick={() => onTabChange(tab.id)}
					className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 ${
						activeTab === tab.id
							? 'bg-[#111] text-white'
							: 'bg-[#f5f5f5] text-[#666] hover:bg-[#eee] hover:text-[#444]'
					}`}
				>
					{tab.label}
				</button>
			))}
		</div>
	);
}
```

- [ ] **Step 2: Update barrel export**

Replace `src/components/ui/index.ts` with:

```ts
export { AddButton } from './AddButton';
export { EmptyState } from './EmptyState';
export { FormField } from './FormField';
export { IconButton } from './IconButton';
export { MoveButtons } from './MoveButtons';
export { ReorderableList } from './ReorderableList';
export { SectionCard } from './SectionCard';
export { SectionTabs } from './SectionTabs';
```

- [ ] **Step 3: Verify no type errors**

Run: `npm run typecheck`
Expected: PASS (Accordion removal may cause errors in Sidebar.tsx — that's expected and fixed in Task 4)

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/SectionTabs.tsx src/components/ui/index.ts
git commit -m "feat: add SectionTabs pill-tab navigation component"
```

---

### Task 3: Create DownloadButton Component with Sonner Toasts

**Files:**
- Create: `src/components/DownloadButton.tsx`
- Modify: `src/app/layout.tsx` (add Toaster)

- [ ] **Step 1: Add Toaster to root layout**

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
	title: 'CV Make',
	description: 'Create professional resumes with ease',
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

- [ ] **Step 2: Create DownloadButton component**

Create `src/components/DownloadButton.tsx`:

```tsx
'use client';

import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useResumeStore } from '@/store/useResumeStore';

export function DownloadButton() {
	const getResumeData = useResumeStore((state) => state.getResumeData);
	const [isDownloading, setIsDownloading] = useState(false);

	const handleDownload = async () => {
		setIsDownloading(true);

		try {
			const resumeData = getResumeData();

			const response = await fetch('/api/pdf', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(resumeData),
			});

			if (!response.ok) {
				const contentType = response.headers.get('content-type');
				let errorData: Record<string, string> = {};

				if (contentType?.includes('application/json')) {
					errorData = await response.json();
				}

				if (response.status === 429) {
					const retryAfter = parseInt(
						response.headers.get('retry-after') || '0',
						10,
					);
					toast.warning(
						errorData.message || 'Too many requests. Please wait before trying again.',
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
					toast.error('PDF generation timed out. Please try again.');
					return;
				}

				if (response.status === 400) {
					toast.error('Invalid resume data. Please check your information.');
					return;
				}

				toast.error(errorData.error || 'Failed to generate PDF. Please try again.');
				return;
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${resumeData.personalInfo.fullName || 'resume'}.pdf`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			console.error('Download error:', error);
			toast.error('Network error. Please check your connection and try again.');
		} finally {
			setIsDownloading(false);
		}
	};

	return (
		<button
			type="button"
			onClick={handleDownload}
			disabled={isDownloading}
			className="btn-primary flex items-center gap-2 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
		>
			{isDownloading ? (
				<Loader2 className="w-4 h-4 animate-spin" />
			) : (
				<Download className="w-4 h-4" />
			)}
			{isDownloading ? 'Generating...' : 'Download PDF'}
		</button>
	);
}
```

- [ ] **Step 3: Verify no type errors**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/DownloadButton.tsx src/app/layout.tsx
git commit -m "feat: add DownloadButton with Sonner toast notifications"
```

---

### Task 4: Redesign Sidebar with Tab Navigation

**Files:**
- Modify: `src/components/Sidebar.tsx` (full rewrite)
- Delete: `src/components/ui/Accordion.tsx`

- [ ] **Step 1: Rewrite Sidebar component**

Replace `src/components/Sidebar.tsx` with:

```tsx
'use client';

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
				<div className="flex items-center gap-2">
					<div className="w-6 h-6 bg-[#111] rounded-md flex items-center justify-center">
						<span className="text-white text-[10px] font-bold">CV</span>
					</div>
					<span className="text-[15px] font-bold text-[#111] tracking-tight">CV Make</span>
				</div>
			</div>

			{/* Tab navigation */}
			<SectionTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

			{/* Form content */}
			<div className="flex-1 overflow-y-auto px-5 py-4">
				{TAB_CONTENT[activeTab]}
			</div>

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

- [ ] **Step 2: Delete Accordion component**

Delete `src/components/ui/Accordion.tsx`.

- [ ] **Step 3: Verify no type errors**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/Sidebar.tsx src/components/ui/index.ts
git rm src/components/ui/Accordion.tsx
git commit -m "feat: replace accordion navigation with pill-tab sidebar"
```

---

### Task 5: Redesign Page Layout and Preview Area

**Files:**
- Modify: `src/app/page.tsx` (remove Header, restructure)
- Modify: `src/components/ResumePreview.tsx` (dot-grid bg, integrate DownloadButton)
- Delete: `src/components/Header.tsx`

- [ ] **Step 1: Update page layout**

Replace `src/app/page.tsx` with:

```tsx
'use client';

import { ResumePreview } from '@/components/ResumePreview';
import { Sidebar } from '@/components/Sidebar';

export default function Home() {
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

- [ ] **Step 2: Update ResumePreview with dot-grid background and DownloadButton**

Replace `src/components/ResumePreview.tsx` with:

```tsx
'use client';

import { memo, useEffect, useState } from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { clientTemplateStyles, ResumeTemplate } from '@/templates/basicTemplate';
import { DownloadButton } from './DownloadButton';

export const ResumePreview = memo(function ResumePreview() {
	const [isHydrated, setIsHydrated] = useState(false);
	const personalInfo = useResumeStore((state) => state.personalInfo);
	const workExperience = useResumeStore((state) => state.workExperience);
	const education = useResumeStore((state) => state.education);
	const skills = useResumeStore((state) => state.skills);
	const languages = useResumeStore((state) => state.languages);

	useEffect(() => {
		setIsHydrated(true);
	}, []);

	const dotGridBg = {
		backgroundColor: '#f3f3f3',
		backgroundImage: 'radial-gradient(circle, #d5d5d5 0.8px, transparent 0.8px)',
		backgroundSize: '16px 16px',
	};

	if (!isHydrated) {
		return (
			<div className="min-h-full p-6 flex justify-center items-center" style={dotGridBg}>
				<div className="text-[#888]">Loading...</div>
			</div>
		);
	}

	const data = {
		personalInfo,
		workExperience,
		education,
		skills,
		languages,
	};

	return (
		<div className="min-h-full p-6 flex justify-center relative" style={dotGridBg}>
			{/* Floating download button */}
			<div className="absolute top-4 right-4 z-10">
				<DownloadButton />
			</div>

			<style>{clientTemplateStyles}</style>
			<div className="resume-container shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
				<ResumeTemplate data={data} showPlaceholders />
			</div>
		</div>
	);
});
```

- [ ] **Step 3: Delete Header component**

Delete `src/components/Header.tsx`.

- [ ] **Step 4: Verify no type errors**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Verify build succeeds**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx src/components/ResumePreview.tsx
git rm src/components/Header.tsx
git commit -m "feat: redesign layout with dot-grid preview and floating download button"
```

---

### Task 6: Restyle FormField Component

**Files:**
- Modify: `src/components/ui/FormField.tsx`

- [ ] **Step 1: Update FormField with new label/input structure**

Replace `src/components/ui/FormField.tsx` with:

```tsx
'use client';

type FormFieldType = 'text' | 'email' | 'tel' | 'textarea';

interface FormFieldProps {
	label?: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	type?: FormFieldType;
	className?: string;
	minHeight?: string;
}

export function FormField({
	label,
	value,
	onChange,
	placeholder,
	type = 'text',
	className = '',
	minHeight = '100px',
}: FormFieldProps) {
	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		onChange(e.target.value);
	};

	if (type === 'textarea') {
		return (
			<div className={className}>
				{label && <span className="form-label">{label}</span>}
				<textarea
					className="form-input resize-y"
					value={value}
					onChange={handleChange}
					placeholder={placeholder}
					style={{ minHeight }}
				/>
			</div>
		);
	}

	return (
		<div className={className}>
			{label && <span className="form-label">{label}</span>}
			<input
				type={type}
				className="form-input"
				value={value}
				onChange={handleChange}
				placeholder={placeholder}
			/>
		</div>
	);
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/FormField.tsx
git commit -m "style: restyle FormField with separate label and updated input styling"
```

---

### Task 7: Restyle AddButton, IconButton, and MoveButtons

**Files:**
- Modify: `src/components/ui/AddButton.tsx`
- Modify: `src/components/ui/IconButton.tsx`
- Modify: `src/components/ui/MoveButtons.tsx`

- [ ] **Step 1: Update AddButton — both variants become dashed style**

Replace `src/components/ui/AddButton.tsx` with:

```tsx
'use client';

import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';

type AddButtonVariant = 'full' | 'inline';

interface AddButtonProps {
	onClick: () => void;
	variant?: AddButtonVariant;
	children: ReactNode;
	disabled?: boolean;
	className?: string;
}

export function AddButton({
	onClick,
	variant = 'full',
	children,
	disabled = false,
	className = '',
}: AddButtonProps) {
	if (variant === 'inline') {
		return (
			<button
				type="button"
				onClick={onClick}
				disabled={disabled}
				className={`mt-2 w-full py-2 text-xs text-[#999] border border-dashed border-[#ddd]
				rounded-lg hover:border-[#bbb] hover:text-[#666] transition-colors
				flex items-center justify-center gap-1
				disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
			>
				<Plus className="w-3.5 h-3.5" /> {children}
			</button>
		);
	}

	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={`btn-secondary disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
		>
			<Plus className="w-4 h-4" /> {children}
		</button>
	);
}
```

- [ ] **Step 2: Update IconButton colors**

Replace `src/components/ui/IconButton.tsx` with:

```tsx
'use client';

import type { LucideIcon } from 'lucide-react';

type IconButtonVariant = 'danger' | 'ghost' | 'primary';

interface IconButtonProps {
	icon: LucideIcon;
	onClick: () => void;
	variant?: IconButtonVariant;
	title?: string;
	disabled?: boolean;
	className?: string;
	size?: 'sm' | 'md';
}

const variantStyles: Record<IconButtonVariant, string> = {
	danger: 'text-[#ddd] hover:text-[#ef4444]',
	ghost: 'text-[#ccc] hover:text-[#666]',
	primary: 'text-[#888] hover:text-[#111]',
};

export function IconButton({
	icon: Icon,
	onClick,
	variant = 'ghost',
	title,
	disabled = false,
	className = '',
	size = 'sm',
}: IconButtonProps) {
	const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
	const padding = size === 'sm' ? 'p-1.5' : 'p-2';

	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={`${variantStyles[variant]} ${padding} rounded-md
			transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
			title={title}
		>
			<Icon className={iconSize} />
		</button>
	);
}
```

- [ ] **Step 3: Update MoveButtons colors**

Replace `src/components/ui/MoveButtons.tsx` with:

```tsx
'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';

interface MoveButtonsProps {
	onMoveUp: () => void;
	onMoveDown: () => void;
	isFirst: boolean;
	isLast: boolean;
	size?: 'sm' | 'md';
	className?: string;
}

export function MoveButtons({
	onMoveUp,
	onMoveDown,
	isFirst,
	isLast,
	size = 'sm',
	className = '',
}: MoveButtonsProps) {
	const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

	return (
		<div className={`flex flex-col ${className}`}>
			<button
				type="button"
				onClick={onMoveUp}
				disabled={isFirst}
				className="text-[#ccc] hover:text-[#666] p-0.5 transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
				title="Move up"
			>
				<ChevronUp className={iconSize} />
			</button>
			<button
				type="button"
				onClick={onMoveDown}
				disabled={isLast}
				className="text-[#ccc] hover:text-[#666] p-0.5 transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
				title="Move down"
			>
				<ChevronDown className={iconSize} />
			</button>
		</div>
	);
}
```

- [ ] **Step 4: Verify no type errors**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/AddButton.tsx src/components/ui/IconButton.tsx src/components/ui/MoveButtons.tsx
git commit -m "style: restyle AddButton, IconButton, and MoveButtons"
```

---

### Task 8: Restyle SectionCard

**Files:**
- Modify: `src/components/ui/SectionCard.tsx`

- [ ] **Step 1: Update SectionCard with new header/body structure**

Replace `src/components/ui/SectionCard.tsx` with:

```tsx
'use client';

import { ChevronRight, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { IconButton } from './IconButton';
import { MoveButtons } from './MoveButtons';

interface SectionCardProps {
	title: ReactNode;
	children: ReactNode;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onDelete: () => void;
	isFirst: boolean;
	isLast: boolean;
	collapsible?: boolean;
	defaultCollapsed?: boolean;
	className?: string;
}

export function SectionCard({
	title,
	children,
	onMoveUp,
	onMoveDown,
	onDelete,
	isFirst,
	isLast,
	collapsible = false,
	defaultCollapsed = false,
	className = '',
}: SectionCardProps) {
	const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

	return (
		<div className={`section-card ${className}`}>
			<div className="section-card-header">
				{collapsible ? (
					<button
						type="button"
						onClick={() => setIsCollapsed(!isCollapsed)}
						className="flex items-center gap-2 text-xs font-semibold text-[#111] hover:text-[#333]"
					>
						<ChevronRight
							className={`w-3.5 h-3.5 transition-transform duration-150 ${isCollapsed ? '' : 'rotate-90'}`}
						/>
						<span>{title}</span>
					</button>
				) : (
					<span className="text-xs font-semibold text-[#111]">{title}</span>
				)}
				<div className="flex items-center gap-0.5">
					<MoveButtons
						onMoveUp={onMoveUp}
						onMoveDown={onMoveDown}
						isFirst={isFirst}
						isLast={isLast}
					/>
					<IconButton icon={Trash2} onClick={onDelete} variant="danger" title="Delete" />
				</div>
			</div>

			{(!collapsible || !isCollapsed) && (
				<div className="section-card-body">{children}</div>
			)}
		</div>
	);
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/SectionCard.tsx
git commit -m "style: restyle SectionCard with new header/body treatment"
```

---

### Task 9: Update PersonalInfoForm Labels

**Files:**
- Modify: `src/components/forms/PersonalInfoForm.tsx`

The form inputs already use `.form-input` and `.form-label` classes, so most styling is automatic. However, the Links section uses a bare `<span className="form-label">` and inline inputs need the new label pattern.

- [ ] **Step 1: Update PersonalInfoForm for consistent labels**

Replace `src/components/forms/PersonalInfoForm.tsx` with:

```tsx
'use client';

import { Trash2 } from 'lucide-react';
import { AddButton, FormField, IconButton, MoveButtons } from '@/components/ui';
import { useResumeStore } from '@/store/useResumeStore';

export function PersonalInfoForm() {
	const { personalInfo, updatePersonalInfo, addLink, updateLink, removeLink, moveLink } =
		useResumeStore();

	return (
		<div className="space-y-4">
			<FormField
				label="Full Name"
				value={personalInfo.fullName}
				onChange={(value) => updatePersonalInfo({ fullName: value })}
				placeholder="John Doe"
			/>

			<div className="flex gap-3">
				<FormField
					label="Phone"
					value={personalInfo.phone ?? ''}
					onChange={(value) => updatePersonalInfo({ phone: value })}
					placeholder="+1 (234) 567-8900"
					className="flex-1"
				/>
				<FormField
					label="City"
					value={personalInfo.city ?? ''}
					onChange={(value) => updatePersonalInfo({ city: value })}
					placeholder="New York, NY"
					className="flex-1"
				/>
			</div>

			<div>
				<span className="form-label">Links</span>
				<div className="space-y-2">
					{personalInfo.links.map((link, index) => (
						<div key={index} className="flex gap-2 items-center">
							<MoveButtons
								onMoveUp={() => moveLink(index, 'up')}
								onMoveDown={() => moveLink(index, 'down')}
								isFirst={index === 0}
								isLast={index === personalInfo.links.length - 1}
							/>
							<input
								type="text"
								className="form-input flex-1"
								value={link}
								onChange={(e) => updateLink(index, e.target.value)}
								placeholder="https://linkedin.com/in/username"
							/>
							<IconButton
								icon={Trash2}
								onClick={() => removeLink(index)}
								variant="danger"
								title="Delete"
							/>
						</div>
					))}
				</div>
				<AddButton onClick={addLink} variant="inline">
					Add link
				</AddButton>
			</div>

			<FormField
				label="Summary"
				type="textarea"
				value={personalInfo.summary}
				onChange={(value) => updatePersonalInfo({ summary: value })}
				placeholder="A brief professional summary..."
				minHeight="80px"
			/>
		</div>
	);
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/forms/PersonalInfoForm.tsx
git commit -m "style: update PersonalInfoForm with 2-col layout and consistent labels"
```

---

### Task 10: Update Remaining Form Components

**Files:**
- Modify: `src/components/forms/SkillsForm.tsx`

The WorkExperienceForm, EducationForm, and LanguagesForm already use `.form-input` classes and UI components that have been restyled — no changes needed. SkillsForm needs the "Add Skill" button moved to the bottom (currently at top).

- [ ] **Step 1: Move Add Skill button to bottom**

Replace `src/components/forms/SkillsForm.tsx` with:

```tsx
'use client';

import { X } from 'lucide-react';
import { AddButton, EmptyState, IconButton, MoveButtons } from '@/components/ui';
import { useResumeStore } from '@/store/useResumeStore';

export function SkillsForm() {
	const { skills, addSkill, updateSkill, removeSkill, moveSkill } = useResumeStore();

	return (
		<div className="space-y-3">
			<div className="space-y-2">
				{skills.map((skill, index) => (
					<div key={skill.id} className="flex gap-2 items-center">
						<MoveButtons
							onMoveUp={() => moveSkill(skill.id, 'up')}
							onMoveDown={() => moveSkill(skill.id, 'down')}
							isFirst={index === 0}
							isLast={index === skills.length - 1}
						/>
						<input
							type="text"
							className="form-input w-1/3"
							value={skill.name}
							onChange={(e) => updateSkill(skill.id, { name: e.target.value })}
							placeholder="Skill name"
						/>
						<input
							type="text"
							className="form-input flex-1"
							value={skill.description}
							onChange={(e) => updateSkill(skill.id, { description: e.target.value })}
							placeholder="Description"
						/>
						<IconButton
							icon={X}
							onClick={() => removeSkill(skill.id)}
							variant="danger"
							title="Delete"
						/>
					</div>
				))}
			</div>

			<EmptyState show={skills.length === 0}>
				No skills added yet. Add your technical and soft skills.
			</EmptyState>

			<AddButton onClick={addSkill}>Add Skill</AddButton>
		</div>
	);
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/forms/SkillsForm.tsx
git commit -m "style: move Add Skill button to bottom for consistency"
```

---

### Task 11: Lint, Build, and Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Run linter**

Run: `npm run lint`
Expected: PASS (or only pre-existing warnings)

- [ ] **Step 2: Run linter with auto-fix if needed**

Run: `npm run lint:fix`

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 5: Run unit tests**

Run: `npm run test`
Expected: All tests pass (tests don't test UI styling, so they should be unaffected)

- [ ] **Step 6: Commit any lint fixes**

```bash
git add -A
git commit -m "chore: lint fixes after UI redesign"
```

- [ ] **Step 7: Manual smoke test**

Run: `npm run dev`

Verify in browser:
1. Sidebar shows logo + CV Make branding with icon badge
2. Pill tabs show and switch between 5 sections
3. Forms display with new input styling (rounded, generous padding)
4. Preview area has dot-grid background
5. Download PDF button floats in top-right of preview
6. Sidebar resizing works (drag right edge)
7. Toast notifications appear on download errors
8. Resume preview renders correctly
