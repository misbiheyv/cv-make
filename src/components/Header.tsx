'use client';

import { Download } from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';
import { useState } from 'react';

export function Header() {
  const getResumeData = useResumeStore((state) => state.getResumeData);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const resumeData = getResumeData();

      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resumeData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
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
      alert('Failed to download PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <header className="h-14 border-b border-gray-300 bg-white flex items-center justify-end px-4 gap-4 shadow-sm">
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="btn-primary flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        {isDownloading ? 'Generating...' : 'Download PDF'}
      </button>
    </header>
  );
}
