'use client';

import { memo, useEffect, useState } from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { clientTemplateStyles, ResumeTemplate } from '@/templates/basicTemplate';
import { DownloadButton } from './DownloadButton';

export const ResumePreview = memo(function ResumePreview() {
	const [isHydrated, setIsHydrated] = useState(false);
	const personalInfo = useResumeStore((state) => state.personalInfo);
	const workExperience = useResumeStore((state) => state.workExperience);
	const education = useResumeStore((state) => state.education);
	const skills = useResumeStore((state) => state.skills);
	const languages = useResumeStore((state) => state.languages);

	useEffect(() => {
		setIsHydrated(true);
	}, []);

	const dotGridBg = {
		backgroundColor: '#f3f3f3',
		backgroundImage: 'radial-gradient(circle, #d5d5d5 0.8px, transparent 0.8px)',
		backgroundSize: '16px 16px',
	};

	if (!isHydrated) {
		return (
			<div className="min-h-full p-6 flex justify-center items-center" style={dotGridBg}>
				<div className="text-[#888]">Loading...</div>
			</div>
		);
	}

	const data = {
		personalInfo,
		workExperience,
		education,
		skills,
		languages,
	};

	return (
		<div className="min-h-full p-6 flex justify-center relative" style={dotGridBg}>
			{/* Floating download button */}
			<div className="fixed top-4 right-4 z-10">
				<DownloadButton />
			</div>

			<style>{clientTemplateStyles}</style>
			<div className="resume-container shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
				<ResumeTemplate data={data} showPlaceholders />
			</div>
		</div>
	);
});
