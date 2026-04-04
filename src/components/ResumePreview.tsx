'use client';

import { useState, useEffect, memo } from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { ResumeTemplate, clientTemplateStyles } from '@/templates/basicTemplate';

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

  if (!isHydrated) {
    return (
      <div className="bg-gray-600 min-h-full p-6 flex justify-center items-center overflow-auto">
        <div className="text-white">Loading...</div>
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
    <div className="bg-gray-600 min-h-full p-6 flex justify-center overflow-auto">
      <style>{clientTemplateStyles}</style>
      <div className="resume-container shadow-lg">
        <ResumeTemplate data={data} showPlaceholders />
      </div>
    </div>
  );
});
