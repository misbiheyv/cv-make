'use client';

import { useEffect, useRef, useState } from 'react';
import { EducationForm } from './forms/EducationForm';
import { LanguagesForm } from './forms/LanguagesForm';
import { PersonalInfoForm } from './forms/PersonalInfoForm';
import { SkillsForm } from './forms/SkillsForm';
import { WorkExperienceForm } from './forms/WorkExperienceForm';
import { SectionTabs } from './ui/SectionTabs';

const TABS = [
	{ id: 'personal', label: 'Personal' },
	{ id: 'experience', label: 'Experience' },
	{ id: 'education', label: 'Education' },
	{ id: 'skills', label: 'Skills' },
	{ id: 'languages', label: 'Languages' },
];

const TAB_CONTENT: Record<string, React.ReactNode> = {
	personal: <PersonalInfoForm />,
	experience: <WorkExperienceForm />,
	education: <EducationForm />,
	skills: <SkillsForm />,
	languages: <LanguagesForm />,
};

export function Sidebar() {
	const [width, setWidth] = useState(550);
	const [isResizing, setIsResizing] = useState(false);
	const [activeTab, setActiveTab] = useState('personal');
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
			className="h-screen flex flex-col border-r border-[#e5e5e5] bg-white relative"
		>
			{/* Header */}
			<div className="px-5 py-4 border-b border-[#f0f0f0]">
				<div className="flex items-center gap-2">
					<div className="w-6 h-6 bg-[#111] rounded-md flex items-center justify-center">
						<span className="text-white text-[10px] font-bold">CV</span>
					</div>
					<span className="text-[15px] font-bold text-[#111] tracking-tight">CV Make</span>
				</div>
			</div>

			{/* Tab navigation */}
			<SectionTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

			{/* Form content */}
			<div className="flex-1 overflow-y-auto px-5 py-4">
				{TAB_CONTENT[activeTab]}
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
