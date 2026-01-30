'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';

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
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const padding = size === 'sm' ? 'p-1' : 'p-1.5';

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <button
        type="button"
        onClick={onMoveUp}
        disabled={isFirst}
        className={`text-gray-400 hover:text-gray-700 ${padding} disabled:opacity-30 disabled:cursor-not-allowed`}
        title="Move up"
      >
        <ChevronUp className={iconSize} />
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={isLast}
        className={`text-gray-400 hover:text-gray-700 ${padding} disabled:opacity-30 disabled:cursor-not-allowed`}
        title="Move down"
      >
        <ChevronDown className={iconSize} />
      </button>
    </div>
  );
}
