export interface PersonalInfo {
	fullName: string;
	phone?: string;
	city?: string;
	links: string[];
	summary: string;
}

export interface WorkExperience {
	id: string;
	title: string;
	company: string;
	location: string;
	startDate: string;
	endDate: string;
	bullets: string[];
}

export interface Education {
	id: string;
	degree: string;
	institution: string;
	location: string;
	startDate: string;
	endDate: string;
	description?: string;
}

export interface Language {
	id: string;
	name: string;
	level: string;
}

export interface ResumeData {
	personalInfo: PersonalInfo;
	workExperience: WorkExperience[];
	education: Education[];
	skills: string[];
	languages: Language[];
}

export const createEmptyResumeData = (): ResumeData => ({
	personalInfo: {
		fullName: '',
		links: [],
		summary: '',
	},
	workExperience: [],
	education: [],
	skills: [],
	languages: [],
});

export const generateId = (): string => crypto.randomUUID();
