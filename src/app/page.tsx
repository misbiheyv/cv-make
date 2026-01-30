'use client';

import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ResumePreview } from '@/components/ResumePreview';

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
