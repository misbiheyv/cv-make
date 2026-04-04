'use client';

import { Header } from '@/components/Header';
import { ResumePreview } from '@/components/ResumePreview';
import { Sidebar } from '@/components/Sidebar';

export default function Home() {
	return (
		<div className="flex h-screen overflow-hidden">
			<Sidebar />
			<div className="flex-1 flex flex-col">
				<Header />
				<main className="flex-1 overflow-auto">
					<ResumePreview />
				</main>
			</div>
		</div>
	);
}
