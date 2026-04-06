import {z} from "zod";

export const PersonalInfoSchema = z.object({
    fullName: z.string(),
    phone: z.string().optional(),
    city: z.string().optional(),
    links: z.array(z.string()),
    summary: z.string(),
});

export const WorkExperienceSchema = z.object({
    id: z.string(),
    title: z.string(),
    company: z.string(),
    location: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    bullets: z.array(z.string()),
});

export const EducationSchema = z.object({
    id: z.string(),
    degree: z.string(),
    institution: z.string(),
    location: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    description: z.string().optional(),
});

export const LanguageSchema = z.object({
    id: z.string(),
    name: z.string(),
    level: z.string(),
});

export const SkillSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
});

export const ResumeDataSchema = z.object({
    personalInfo: PersonalInfoSchema,
    workExperience: z.array(WorkExperienceSchema),
    education: z.array(EducationSchema),
    skills: z.array(SkillSchema),
    languages: z.array(LanguageSchema),
});
