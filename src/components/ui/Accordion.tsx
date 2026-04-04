'use client';

import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

interface AccordionProps {
	title: string;
	children: ReactNode;
	defaultOpen?: boolean;
}

export function Accordion({ title, children, defaultOpen = false }: AccordionProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<div className="border-b border-gray-300">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="w-full flex items-center justify-between py-3 px-4 text-left hover:bg-gray-50 transition-colors"
			>
				<span className="font-mono text-sm font-medium">{title}</span>
				<ChevronRight
					className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
				/>
			</button>
			{isOpen && <div className="px-4 pb-4">{children}</div>}
		</div>
	);
}
