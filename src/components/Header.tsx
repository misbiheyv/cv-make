'use client';

import { Download, AlertCircle, Clock } from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';
import { useState } from 'react';

type ErrorType = 'rate_limit' | 'timeout' | 'validation' | 'generic';

interface ErrorState {
  type: ErrorType;
  message: string;
  retryAfter?: number;
}

export function Header() {
  const getResumeData = useResumeStore((state) => state.getResumeData);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);

    try {
      const resumeData = getResumeData();

      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resumeData),
      });

      // Handle different error responses
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorData: any = {};

        if (contentType?.includes('application/json')) {
          errorData = await response.json();
        }

        // Rate limit error
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('retry-after') || '0', 10);
          setError({
            type: 'rate_limit',
            message: errorData.message || 'Too many requests. Please wait before trying again.',
            retryAfter,
          });
          return;
        }

        // Timeout error
        if (response.status === 504) {
          setError({
            type: 'timeout',
            message: 'PDF generation timed out. Please try again.',
          });
          return;
        }

        // Validation error
        if (response.status === 400) {
          setError({
            type: 'validation',
            message: 'Invalid resume data. Please check your information.',
          });
          return;
        }

        // Generic server error
        setError({
          type: 'generic',
          message: errorData.error || 'Failed to generate PDF. Please try again.',
        });
        return;
      }

      // Success - download PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resumeData.personalInfo.fullName || 'resume'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Clear any previous errors
      setError(null);
    } catch (error) {
      console.error('Download error:', error);
      setError({
        type: 'generic',
        message: 'Network error. Please check your connection and try again.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const getErrorIcon = () => {
    switch (error?.type) {
      case 'rate_limit':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getErrorColor = () => {
    switch (error?.type) {
      case 'rate_limit':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'timeout':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      default:
        return 'text-red-700 bg-red-50 border-red-200';
    }
  };

  return (
    <>
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

      {/* Error notification */}
      {error && (
        <div className={`mx-4 mt-4 p-3 rounded-lg border flex items-start gap-3 ${getErrorColor()}`}>
          <div className="flex-shrink-0 mt-0.5">{getErrorIcon()}</div>
          <div className="flex-1">
            <p className="text-sm font-medium">{error.message}</p>
            {error.retryAfter && (
              <p className="text-xs mt-1">
                Please wait {error.retryAfter} seconds before trying again.
              </p>
            )}
          </div>
          <button
            onClick={() => setError(null)}
            className="flex-shrink-0 text-sm hover:opacity-70"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
