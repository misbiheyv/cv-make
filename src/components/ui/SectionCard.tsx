'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { Trash2, ChevronRight } from 'lucide-react';
import { MoveButtons } from './MoveButtons';
import { IconButton } from './IconButton';

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
      <div className="flex justify-between items-center mb-3">
        {collapsible ? (
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform ${
                isCollapsed ? '' : 'rotate-90'
              }`}
            />
            <span>{title}</span>
          </button>
        ) : (
          <span className="text-sm font-medium text-gray-500">{title}</span>
        )}
        <div className="flex gap-1 items-center">
          <MoveButtons
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            isFirst={isFirst}
            isLast={isLast}
          />
          <IconButton
            icon={Trash2}
            onClick={onDelete}
            variant="danger"
            title="Delete"
          />
        </div>
      </div>

      {(!collapsible || !isCollapsed) && children}
    </div>
  );
}
