'use client';

import type { LucideIcon } from 'lucide-react';

type IconButtonVariant = 'danger' | 'ghost' | 'primary';

interface IconButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  variant?: IconButtonVariant;
  title?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

const variantStyles: Record<IconButtonVariant, string> = {
  danger: 'text-red-500 hover:text-red-700',
  ghost: 'text-gray-400 hover:text-gray-700',
  primary: 'text-gray-600 hover:text-black',
};

export function IconButton({
  icon: Icon,
  onClick,
  variant = 'ghost',
  title,
  disabled = false,
  className = '',
  size = 'sm',
}: IconButtonProps) {
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const padding = size === 'sm' ? 'p-2' : 'p-2.5';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${variantStyles[variant]} ${padding} disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
      title={title}
    >
      <Icon className={iconSize} />
    </button>
  );
}
