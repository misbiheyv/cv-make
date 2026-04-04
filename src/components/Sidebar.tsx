'use client';

import { useEffect, useRef, useState } from 'react';
import { EducationForm } from './forms/EducationForm';
import { LanguagesForm } from './forms/LanguagesForm';
import { PersonalInfoForm } from './forms/PersonalInfoForm';
import { SkillsForm } from './forms/SkillsForm';
import { WorkExperienceForm } from './forms/WorkExperienceForm';
import { Accordion } from './ui/Accordion';

export function Sidebar() {
	const [width, setWidth] = useState(550);
	const [isResizing, setIsResizing] = useState(false);
	const sidebarRef = useRef<HTMLDivElement>(null);

	const startResizing = () => {
		setIsResizing(true);
	};

	useEffect(() => {
		const stopResizing = () => {
			setIsResizing(false);
		};

		const resize = (e: MouseEvent) => {
			const newWidth = e.clientX;
			if (newWidth >= 400 && newWidth <= 800) {
				setWidth(newWidth);
			}
		};

		if (isResizing) {
			document.body.style.userSelect = 'none';
			window.addEventListener('mousemove', resize);
			window.addEventListener('mouseup', stopResizing);
		} else {
			document.body.style.userSelect = '';
		}

		return () => {
			document.body.style.userSelect = '';
			window.removeEventListener('mousemove', resize);
			window.removeEventListener('mouseup', stopResizing);
		};
	}, [isResizing]);

	return (
		<aside
			ref={sidebarRef}
			style={{ width: `${width}px`, minWidth: `${width}px` }}
			className="h-screen overflow-y-auto border-r border-gray-200 bg-white relative"
		>
			<div className="sticky top-0 bg-white border-b border-gray-300 p-4 z-10 shadow-sm">
				<h1 className="text-xl font-bold flex items-center gap-2">
					<span className="text-2xl">📄</span>
					Resume Builder
				</h1>
			</div>

			<div>
				<Accordion title="Main Information" defaultOpen={true}>
					<PersonalInfoForm />
				</Accordion>

				<Accordion title="Work Experience">
					<WorkExperienceForm />
				</Accordion>

				<Accordion title="Education">
					<EducationForm />
				</Accordion>

				<Accordion title="Skills">
					<SkillsForm />
				</Accordion>

				<Accordion title="Languages">
					<LanguagesForm />
				</Accordion>
			</div>

			{/* Resize Handle */}
			{/* biome-ignore lint/a11y/useSemanticElements: resize handle requires custom div */}
			<div
				role="separator"
				tabIndex={0}
				aria-orientation="vertical"
				aria-valuenow={width}
				aria-valuemin={400}
				aria-valuemax={800}
				aria-label="Resize sidebar"
				onMouseDown={startResizing}
				className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-blue-500 transition-colors"
				style={{ touchAction: 'none' }}
			/>
		</aside>
	);
}
