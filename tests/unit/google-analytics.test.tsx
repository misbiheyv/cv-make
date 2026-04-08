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
