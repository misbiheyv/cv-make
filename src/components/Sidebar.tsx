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

const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0';

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
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="w-6 h-6 bg-[#111] rounded-md flex items-center justify-center">
							<svg
								width="14"
								height="14"
								viewBox="0 0 28 28"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<title>CV Make logo</title>
								<path
									d="M5 3 H18 L23 8 V25 H5 Z"
									stroke="white"
									strokeWidth="2.5"
									strokeLinejoin="round"
								/>
								<line
									x1="8"
									y1="13"
									x2="20"
									y2="13"
									stroke="white"
									strokeWidth="2"
									strokeLinecap="round"
								/>
								<line
									x1="8"
									y1="17.5"
									x2="16"
									y2="17.5"
									stroke="white"
									strokeWidth="2"
									strokeLinecap="round"
								/>
							</svg>
						</div>
						<span className="text-[15px] font-bold text-[#111] tracking-tight">CV Make</span>
					</div>
					<div className="flex items-center gap-2.5">
						<span className="text-[10px] text-[#999] bg-[#f5f5f5] px-1.5 py-0.5 rounded">
							v{appVersion}
						</span>
						<a
							href="https://github.com/misbiheyv/cv-make"
							target="_blank"
							rel="noopener noreferrer"
							className="text-[#666] hover:text-[#111] transition-colors"
							aria-label="GitHub repository"
						>
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="currentColor"
								xmlns="http://www.w3.org/2000/svg"
							>
								<title>GitHub</title>
								<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
							</svg>
						</a>
					</div>
				</div>
			</div>

			{/* Tab navigation */}
			<SectionTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

			{/* Form content */}
			<div className="flex-1 overflow-y-auto px-5 py-4">{TAB_CONTENT[activeTab]}</div>

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
