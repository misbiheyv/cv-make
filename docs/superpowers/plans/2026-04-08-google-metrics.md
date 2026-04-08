# Google Metrics Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add GA4 analytics and Google Search Console verification to the CV Make app with zero new dependencies.

**Architecture:** A `GoogleAnalytics` client component loads the gtag.js script conditionally based on an env var. PDF download events are fired inline from the existing `DownloadButton` component. Search Console verification uses Next.js's built-in metadata API.

**Tech Stack:** Next.js `<Script>` component, raw `gtag()` API, Next.js metadata `verification` field, Vitest for tests.

**Spec:** `docs/superpowers/specs/2026-04-08-google-metrics-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/types/gtag.d.ts` | Create | Global TypeScript declaration for `gtag()` and `dataLayer` |
| `src/components/GoogleAnalytics.tsx` | Create | Client component that conditionally loads GA4 scripts |
| `src/app/layout.tsx` | Modify | Add `<GoogleAnalytics />` to body, add `verification.google` to metadata |
| `src/components/DownloadButton.tsx` | Modify | Fire `pdf_download` / `pdf_download_error` gtag events |
| `.env.example` | Modify | Add placeholder env vars |
| `tests/unit/google-analytics.test.tsx` | Create | Unit tests for GoogleAnalytics component |
| `tests/unit/download-button-analytics.test.tsx` | Create | Unit tests for gtag calls in DownloadButton |

---

### Task 1: Global gtag Type Declaration

**Files:**
- Create: `src/types/gtag.d.ts`

- [ ] **Step 1: Create the type declaration file**

```ts
interface GtagEventParams {
	event_category?: string;
	event_label?: string;
	value?: number;
	[key: string]: string | number | undefined;
}

declare function gtag(command: 'js', date: Date): void;
declare function gtag(command: 'config', targetId: string, config?: Record<string, unknown>): void;
declare function gtag(command: 'event', eventName: string, eventParams?: GtagEventParams): void;

interface Window {
	dataLayer: Array<unknown>;
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: No new errors (exit 0).

- [ ] **Step 3: Commit**

```bash
git add src/types/gtag.d.ts
git commit -m "feat(analytics): add global gtag type declaration"
```

---

### Task 2: GoogleAnalytics Component + Tests

**Files:**
- Create: `src/components/GoogleAnalytics.tsx`
- Create: `tests/unit/google-analytics.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/google-analytics.test.tsx`:

```tsx
import {cleanup, render} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

// Mock next/script to render a plain <script> so we can inspect attributes
vi.mock('next/script', () => ({
	default: (props: Record<string, unknown>) => {
		// For inline scripts, render the id; for src scripts, render src
		if (props.src) {
			return <script data-testid="gtag-script" src={props.src as string} />;
		}
		return <script data-testid="gtag-init" id={props.id as string} />;
	},
}));

describe('GoogleAnalytics', () => {
	const ORIGINAL_ENV = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = {...ORIGINAL_ENV};
	});

	afterEach(() => {
		process.env = ORIGINAL_ENV;
		cleanup();
	});

	it('renders nothing when NEXT_PUBLIC_GA_MEASUREMENT_ID is not set', async () => {
		delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
		const {GoogleAnalytics} = await import('@/components/GoogleAnalytics');
		const {container} = render(<GoogleAnalytics />);
		expect(container.innerHTML).toBe('');
	});

	it('renders script tags when measurement ID is present', async () => {
		process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123';
		const {GoogleAnalytics} = await import('@/components/GoogleAnalytics');
		const {getByTestId} = render(<GoogleAnalytics />);
		expect(getByTestId('gtag-script')).toBeDefined();
		expect(getByTestId('gtag-init')).toBeDefined();
	});

	it('passes the correct measurement ID to script src', async () => {
		process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-ABCXYZ';
		const {GoogleAnalytics} = await import('@/components/GoogleAnalytics');
		const {getByTestId} = render(<GoogleAnalytics />);
		const script = getByTestId('gtag-script');
		expect(script.getAttribute('src')).toBe(
			'https://www.googletagmanager.com/gtag/js?id=G-ABCXYZ',
		);
	});
});
```

- [ ] **Step 2: Install @testing-library/react (dev dependency)**

Run: `npm install --save-dev @testing-library/react @testing-library/jest-dom`

This is needed for component rendering in tests. The project doesn't have it yet since existing tests are non-component tests.

- [ ] **Step 3: Add jsdom test environment config**

The vitest config needs a jsdom environment for React component tests. Modify `vitest.config.ts`:

```ts
import path from "node:path";
import {defineConfig} from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	test: {
		environment: "jsdom",
	},
});
```

Also install jsdom: `npm install --save-dev jsdom`

- [ ] **Step 4: Run tests to verify they fail**

Run: `npx vitest run tests/unit/google-analytics.test.tsx`
Expected: FAIL — `Cannot find module '@/components/GoogleAnalytics'`

- [ ] **Step 5: Write the GoogleAnalytics component**

Create `src/components/GoogleAnalytics.tsx`:

```tsx
'use client';

import Script from 'next/script';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
	if (!GA_ID) {
		return null;
	}

	return (
		<>
			<Script
				src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
				strategy="afterInteractive"
			/>
			<Script id="gtag-init" strategy="afterInteractive">
				{`
					window.dataLayer = window.dataLayer || [];
					function gtag(){dataLayer.push(arguments);}
					gtag('js', new Date());
					gtag('config', '${GA_ID}');
				`}
			</Script>
		</>
	);
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run tests/unit/google-analytics.test.tsx`
Expected: 3 tests PASS.

- [ ] **Step 7: Run full unit test suite to check for regressions**

Run: `npm run test`
Expected: All tests pass. If any existing tests break due to the jsdom environment change, add `// @vitest-environment node` comments to those test files.

- [ ] **Step 8: Run typecheck**

Run: `npm run typecheck`
Expected: Exit 0, no errors.

- [ ] **Step 9: Commit**

```bash
git add src/components/GoogleAnalytics.tsx tests/unit/google-analytics.test.tsx vitest.config.ts package.json package-lock.json
git commit -m "feat(analytics): add GoogleAnalytics component with tests"
```

---

### Task 3: Wire GoogleAnalytics + GSC Verification into Layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add GoogleAnalytics component and verification metadata to layout**

In `src/app/layout.tsx`, make two changes:

1. Add `verification` to the metadata export:

```ts
export const metadata: Metadata = {
	// ...existing fields
	verification: {
		google: process.env.NEXT_PUBLIC_GSC_VERIFICATION,
	},
};
```

2. Add the `<GoogleAnalytics />` component inside `<body>`, before `{children}`:

```tsx
import {GoogleAnalytics} from '@/components/GoogleAnalytics';

export default function RootLayout({children}: {children: React.ReactNode}) {
	return (
		<html lang="en">
			<body className="antialiased">
				<GoogleAnalytics />
				<script type="application/ld+json">
					{/* ...existing JSON-LD... */}
				</script>
				{children}
				<Toaster position="top-right" richColors />
			</body>
		</html>
	);
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: Exit 0.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: No new errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(analytics): wire GoogleAnalytics and GSC verification into root layout"
```

---

### Task 4: PDF Download Event Tracking + Tests

**Files:**
- Modify: `src/components/DownloadButton.tsx`
- Create: `tests/unit/download-button-analytics.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/download-button-analytics.test.tsx`:

```tsx
import {cleanup, fireEvent, render, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

// Mock zustand store
vi.mock('@/store/useResumeStore', () => ({
	useResumeStore: (selector: (state: Record<string, unknown>) => unknown) =>
		selector({
			getResumeData: () => ({
				personalInfo: {fullName: 'Test User', links: [], summary: ''},
				workExperience: [],
				education: [],
				skills: [],
				languages: [],
			}),
		}),
}));

// Mock sonner
vi.mock('sonner', () => ({
	toast: {error: vi.fn(), warning: vi.fn()},
}));

describe('DownloadButton analytics events', () => {
	let gtagMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		gtagMock = vi.fn();
		(globalThis as Record<string, unknown>).gtag = gtagMock;
	});

	afterEach(() => {
		delete (globalThis as Record<string, unknown>).gtag;
		cleanup();
		vi.restoreAllMocks();
	});

	it('fires pdf_download event on successful download', async () => {
		const pdfBlob = new Blob(['fake-pdf'], {type: 'application/pdf'});
		global.fetch = vi.fn().mockResolvedValueOnce({
			ok: true,
			blob: () => Promise.resolve(pdfBlob),
		});
		global.URL.createObjectURL = vi.fn().mockReturnValue('blob:fake');
		global.URL.revokeObjectURL = vi.fn();

		const {DownloadButton} = await import('@/components/DownloadButton');
		const {getByRole} = render(<DownloadButton />);
		fireEvent.click(getByRole('button'));

		await waitFor(() => {
			expect(gtagMock).toHaveBeenCalledWith('event', 'pdf_download', {
				event_category: 'conversion',
			});
		});
	});

	it('fires pdf_download_error event on failed download', async () => {
		global.fetch = vi.fn().mockResolvedValueOnce({
			ok: false,
			status: 500,
			headers: {get: () => 'application/json'},
			json: () => Promise.resolve({error: 'Server error'}),
		});

		const {DownloadButton} = await import('@/components/DownloadButton');
		const {getByRole} = render(<DownloadButton />);
		fireEvent.click(getByRole('button'));

		await waitFor(() => {
			expect(gtagMock).toHaveBeenCalledWith('event', 'pdf_download_error', {
				event_category: 'error',
			});
		});
	});

	it('does not throw when gtag is undefined', async () => {
		delete (globalThis as Record<string, unknown>).gtag;
		const pdfBlob = new Blob(['fake-pdf'], {type: 'application/pdf'});
		global.fetch = vi.fn().mockResolvedValueOnce({
			ok: true,
			blob: () => Promise.resolve(pdfBlob),
		});
		global.URL.createObjectURL = vi.fn().mockReturnValue('blob:fake');
		global.URL.revokeObjectURL = vi.fn();

		const {DownloadButton} = await import('@/components/DownloadButton');
		const {getByRole} = render(<DownloadButton />);

		// Should not throw
		expect(() => fireEvent.click(getByRole('button'))).not.toThrow();
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/download-button-analytics.test.tsx`
Expected: FAIL — gtag not called (the component doesn't fire events yet).

- [ ] **Step 3: Add gtag event calls to DownloadButton**

Modify `src/components/DownloadButton.tsx`. Add the gtag calls at two points in `handleDownload`:

After the successful download block (after `document.body.removeChild(a);`, line 68):

```ts
if (typeof gtag !== 'undefined') {
	gtag('event', 'pdf_download', {event_category: 'conversion'});
}
```

In every early-return error path AND in the catch block, add before the `return` / at the end of `catch`:

```ts
if (typeof gtag !== 'undefined') {
	gtag('event', 'pdf_download_error', {event_category: 'error'});
}
```

The complete modified `handleDownload` function:

```ts
const handleDownload = async () => {
	setIsDownloading(true);

	try {
		const resumeData = getResumeData();

		const response = await fetch("/api/pdf", {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify(resumeData),
		});

		if (!response.ok) {
			const contentType = response.headers.get("content-type");
			let errorData: Record<string, string> = {};

			if (contentType?.includes("application/json")) {
				errorData = await response.json();
			}

			if (typeof gtag !== 'undefined') {
				gtag('event', 'pdf_download_error', {event_category: 'error'});
			}

			if (response.status === 429) {
				const retryAfter = parseInt(response.headers.get("retry-after") || "0", 10);
				toast.warning(
					errorData.message || "Too many requests. Please wait before trying again.",
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
				toast.error("PDF generation timed out. Please try again.");
				return;
			}

			if (response.status === 400) {
				toast.error("Invalid resume data. Please check your information.");
				return;
			}

			toast.error(errorData.error || "Failed to generate PDF. Please try again.");
			return;
		}

		const blob = await response.blob();
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${resumeData.personalInfo.fullName || "resume"}.pdf`;
		document.body.appendChild(a);
		a.click();
		window.URL.revokeObjectURL(url);
		document.body.removeChild(a);

		if (typeof gtag !== 'undefined') {
			gtag('event', 'pdf_download', {event_category: 'conversion'});
		}
	} catch (error) {
		console.error("Download error:", error);
		toast.error("Network error. Please check your connection and try again.");
		if (typeof gtag !== 'undefined') {
			gtag('event', 'pdf_download_error', {event_category: 'error'});
		}
	} finally {
		setIsDownloading(false);
	}
};
```

- [ ] **Step 4: Run the analytics tests to verify they pass**

Run: `npx vitest run tests/unit/download-button-analytics.test.tsx`
Expected: 3 tests PASS.

- [ ] **Step 5: Run the full test suite**

Run: `npm run test`
Expected: All tests pass.

- [ ] **Step 6: Run typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: Both exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/components/DownloadButton.tsx tests/unit/download-button-analytics.test.tsx
git commit -m "feat(analytics): add PDF download event tracking with tests"
```

---

### Task 5: Environment Configuration

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add analytics env vars to .env.example**

Append to `.env.example`:

```
# google analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_GSC_VERIFICATION=
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "feat(analytics): add GA and GSC env var placeholders to .env.example"
```

---

### Task 6: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `npm run test:all`
Expected: All unit tests pass.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: Exit 0.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: No errors.

- [ ] **Step 4: Build the project**

Run: `npm run build`
Expected: Build succeeds. The GoogleAnalytics component renders nothing without the env var, so the build should complete without errors.

- [ ] **Step 5: Manual smoke test (optional)**

Run: `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-TEST123 npm run dev`

Open browser DevTools Network tab, navigate to `http://localhost:3000`. Verify:
- A request to `googletagmanager.com/gtag/js?id=G-TEST123` appears
- `window.dataLayer` exists in the console
