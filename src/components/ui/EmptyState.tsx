'use client';

import type { ReactNode } from 'react';

interface EmptyStateProps {
  show: boolean;
  children: ReactNode;
  className?: string;
}

export function EmptyState({ show, children, className = '' }: EmptyStateProps) {
  if (!show) return null;

  return (
    <p className={`text-sm text-gray-500 text-center py-4 ${className}`}>
      {children}
    </p>
  );
}
