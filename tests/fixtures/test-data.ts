export const VALID_RESUME_DATA = {
  personalInfo: {
    fullName: 'Jane Smith',
    links: [
      'jane.smith@example.com',
      '+1-555-0199',
      'https://linkedin.com/in/janesmith',
      'https://github.com/janesmith',
    ],
    summary:
      'Experienced full-stack developer with 8+ years of experience building scalable web applications.',
  },
  workExperience: [
    {
      id: 'exp1',
      title: 'Senior Full-Stack Developer',
      company: 'TechCorp Inc.',
      location: 'New York, NY',
      startDate: '2020-03',
      endDate: 'Present',
      bullets: [
        'Led development of microservices architecture serving 1M+ daily users',
        'Built real-time collaboration features using WebSocket and Redis',
      ],
    },
  ],
  education: [
    {
      id: 'edu1',
      degree: 'Bachelor of Science in Computer Science',
      institution: 'Massachusetts Institute of Technology',
      location: 'Cambridge, MA',
      startDate: '2012-09',
      endDate: '2016-06',
      description: 'Focus on distributed systems and algorithms.',
    },
  ],
  skills: [
    { id: 'skill1', name: 'Languages', description: 'JavaScript, TypeScript, Python' },
    { id: 'skill2', name: 'Frameworks', description: 'React, Next.js, Express' },
    { id: 'skill3', name: 'Tools', description: 'Git, Docker, AWS' },
  ],
  languages: [
    { id: 'lang1', name: 'English', level: 'Native' },
    { id: 'lang2', name: 'Spanish', level: 'Intermediate' },
  ],
};

export const INVALID_RESUME_DATA = {
  personalInfo: { fullName: 123 },
};
