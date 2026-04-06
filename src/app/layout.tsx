import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
	title: 'CV Make',
	description: 'Create professional resumes with ease',
	icons: {
		icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
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
