import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ResumeData, PersonalInfo, WorkExperience, Education, Language } from '@/types/resume';
import { createEmptyResumeData, generateId } from '@/types/resume';

interface ResumeStore extends ResumeData {
  // Personal Info actions
  updatePersonalInfo: (info: Partial<PersonalInfo>) => void;
  addLink: () => void;
  updateLink: (index: number, value: string) => void;
  removeLink: (index: number) => void;
  moveLink: (index: number, direction: 'up' | 'down') => void;

  // Work Experience actions
  addWorkExperience: () => void;
  updateWorkExperience: (id: string, data: Partial<WorkExperience>) => void;
  removeWorkExperience: (id: string) => void;
  moveWorkExperience: (id: string, direction: 'up' | 'down') => void;
  addBullet: (expId: string) => void;
  updateBullet: (expId: string, index: number, value: string) => void;
  removeBullet: (expId: string, index: number) => void;
  moveBullet: (expId: string, index: number, direction: 'up' | 'down') => void;

  // Education actions
  addEducation: () => void;
  updateEducation: (id: string, data: Partial<Education>) => void;
  removeEducation: (id: string) => void;
  moveEducation: (id: string, direction: 'up' | 'down') => void;

  // Skills actions
  addSkill: (skill: string) => void;
  removeSkill: (index: number) => void;
  moveSkill: (index: number, direction: 'up' | 'down') => void;

  // Languages actions
  addLanguage: () => void;
  updateLanguage: (id: string, data: Partial<Language>) => void;
  removeLanguage: (id: string) => void;
  moveLanguage: (id: string, direction: 'up' | 'down') => void;

  // Utility actions
  resetResume: () => void;
  getResumeData: () => ResumeData;
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      ...createEmptyResumeData(),

      // Personal Info
      updatePersonalInfo: (info) =>
        set((state) => ({
          personalInfo: { ...state.personalInfo, ...info },
        })),

      addLink: () =>
        set((state) => ({
          personalInfo: {
            ...state.personalInfo,
            links: [...state.personalInfo.links, ''],
          },
        })),

      updateLink: (index, value) =>
        set((state) => ({
          personalInfo: {
            ...state.personalInfo,
            links: state.personalInfo.links.map((link, i) => i === index ? value : link),
          },
        })),

      removeLink: (index) =>
        set((state) => ({
          personalInfo: {
            ...state.personalInfo,
            links: state.personalInfo.links.filter((_, i) => i !== index),
          },
        })),

      moveLink: (index, direction) =>
        set((state) => {
          const newIndex = direction === 'up' ? index - 1 : index + 1;

          if (newIndex < 0 || newIndex >= state.personalInfo.links.length) {
            return state;
          }

          const newLinks = [...state.personalInfo.links];
          [newLinks[index], newLinks[newIndex]] = [newLinks[newIndex], newLinks[index]];

          return {
            personalInfo: {
              ...state.personalInfo,
              links: newLinks,
            },
          };
        }),

      // Work Experience
      addWorkExperience: () =>
        set((state) => ({
          workExperience: [
            ...state.workExperience,
            {
              id: generateId(),
              title: '',
              company: '',
              location: '',
              startDate: '',
              endDate: '',
              bullets: [''],
            },
          ],
        })),

      updateWorkExperience: (id, data) =>
        set((state) => ({
          workExperience: state.workExperience.map((exp) => exp.id === id ? { ...exp, ...data } : exp),
        })),

      removeWorkExperience: (id) =>
        set((state) => ({
          workExperience: state.workExperience.filter((exp) => exp.id !== id),
        })),

      addBullet: (expId) =>
        set((state) => ({
          workExperience: state.workExperience.map((exp) =>
            exp.id === expId ? { ...exp, bullets: [...exp.bullets, ''] } : exp
          ),
        })),

      updateBullet: (expId, index, value) =>
        set((state) => ({
          workExperience: state.workExperience.map((exp) =>
            exp.id === expId
              ? {
                ...exp,
                bullets: exp.bullets.map((b, i) => (i === index ? value : b)),
              }
              : exp
          ),
        })),

      removeBullet: (expId, index) =>
        set((state) => ({
          workExperience: state.workExperience.map((exp) =>
            exp.id === expId
              ? { ...exp, bullets: exp.bullets.filter((_, i) => i !== index) }
              : exp
          ),
        })),

      moveWorkExperience: (id, direction) =>
        set((state) => {
          const index = state.workExperience.findIndex((exp) => exp.id === id);
          if (index === -1) return state;

          const newIndex = direction === 'up' ? index - 1 : index + 1;
          if (newIndex < 0 || newIndex >= state.workExperience.length) return state;

          const newWorkExperience = [...state.workExperience];
          [newWorkExperience[index], newWorkExperience[newIndex]] =
            [newWorkExperience[newIndex], newWorkExperience[index]];

          return { workExperience: newWorkExperience };
        }),

      moveBullet: (expId, index, direction) =>
        set((state) => ({
          workExperience: state.workExperience.map((exp) => {
            if (exp.id !== expId) return exp;

            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= exp.bullets.length) return exp;

            const newBullets = [...exp.bullets];
            [newBullets[index], newBullets[newIndex]] =
              [newBullets[newIndex], newBullets[index]];

            return { ...exp, bullets: newBullets };
          }),
        })),

      // Education
      addEducation: () =>
        set((state) => ({
          education: [
            ...state.education,
            {
              id: generateId(),
              degree: '',
              institution: '',
              location: '',
              startDate: '',
              endDate: '',
              description: '',
            },
          ],
        })),

      updateEducation: (id, data) =>
        set((state) => ({
          education: state.education.map((edu) =>
            edu.id === id ? { ...edu, ...data } : edu
          ),
        })),

      removeEducation: (id) =>
        set((state) => ({
          education: state.education.filter((edu) => edu.id !== id),
        })),

      moveEducation: (id, direction) =>
        set((state) => {
          const index = state.education.findIndex((edu) => edu.id === id);
          if (index === -1) return state;

          const newIndex = direction === 'up' ? index - 1 : index + 1;
          if (newIndex < 0 || newIndex >= state.education.length) return state;

          const newEducation = [...state.education];
          [newEducation[index], newEducation[newIndex]] =
            [newEducation[newIndex], newEducation[index]];

          return { education: newEducation };
        }),

      // Skills
      addSkill: (skill) =>
        set((state) => ({
          skills: [...state.skills, skill],
        })),

      removeSkill: (index) =>
        set((state) => ({
          skills: state.skills.filter((_, i) => i !== index),
        })),

      moveSkill: (index, direction) =>
        set((state) => {
          const newIndex = direction === 'up' ? index - 1 : index + 1;
          if (newIndex < 0 || newIndex >= state.skills.length) return state;

          const newSkills = [...state.skills];
          [newSkills[index], newSkills[newIndex]] =
            [newSkills[newIndex], newSkills[index]];

          return { skills: newSkills };
        }),

      // Languages
      addLanguage: () =>
        set((state) => ({
          languages: [
            ...state.languages,
            { id: generateId(), name: '', level: '' },
          ],
        })),

      updateLanguage: (id, data) =>
        set((state) => ({
          languages: state.languages.map((lang) =>
            lang.id === id ? { ...lang, ...data } : lang
          ),
        })),

      removeLanguage: (id) =>
        set((state) => ({
          languages: state.languages.filter((lang) => lang.id !== id),
        })),

      moveLanguage: (id, direction) =>
        set((state) => {
          const index = state.languages.findIndex((lang) => lang.id === id);
          if (index === -1) return state;

          const newIndex = direction === 'up' ? index - 1 : index + 1;
          if (newIndex < 0 || newIndex >= state.languages.length) return state;

          const newLanguages = [...state.languages];
          [newLanguages[index], newLanguages[newIndex]] =
            [newLanguages[newIndex], newLanguages[index]];

          return { languages: newLanguages };
        }),

      // Utility
      resetResume: () => set(createEmptyResumeData()),

      getResumeData: () => {
        const state = get();
        return {
          personalInfo: state.personalInfo,
          workExperience: state.workExperience,
          education: state.education,
          skills: state.skills,
          languages: state.languages,
        };
      },
    }),
    {
      name: 'resume-storage',
      version: 1,
    }
  )
);
