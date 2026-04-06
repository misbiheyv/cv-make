'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';

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
	const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

	return (
		<div className={`flex flex-col ${className}`}>
			<button
				type="button"
				onClick={onMoveUp}
				disabled={isFirst}
				className="text-[#ccc] hover:text-[#666] p-0.5 transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
				title="Move up"
			>
				<ChevronUp className={iconSize} />
			</button>
			<button
				type="button"
				onClick={onMoveDown}
				disabled={isLast}
				className="text-[#ccc] hover:text-[#666] p-0.5 transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
				title="Move down"
			>
				<ChevronDown className={iconSize} />
			</button>
		</div>
	);
}
