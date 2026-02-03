import type { ResumeData } from '@/types/resume';

interface ResumeTemplateProps {
  data: ResumeData;
  showPlaceholders?: boolean;
}

export function ResumeTemplate({ data, showPlaceholders = false }: ResumeTemplateProps) {
  const { personalInfo, workExperience, education, skills, languages } = data;
  const contactParts = personalInfo.links.filter(Boolean);

  return (
    <div className="resume">
      {/* Header */}
      <header className="header">
        <h1 className="name">
          {personalInfo.fullName || (showPlaceholders ? 'Your Name' : '')}
        </h1>
        <div className="contact-info">
          {contactParts.length > 0
            ? contactParts.join(' | ')
            : showPlaceholders
              ? 'Contact information will appear here'
              : ''}
        </div>
      </header>

      {/* Summary */}
      {personalInfo.summary && (
        <section className="summary">
          <p>{personalInfo.summary}</p>
        </section>
      )}

      {/* Work Experience */}
      {workExperience.length > 0 && (
        <section className="section">
          <h2 className="section-title">Work Experience</h2>
          {workExperience.map((exp) => (
            <div key={exp.id} className="experience-item">
              <div className="item-header">
                <span className="item-title">
                  {exp.title || (showPlaceholders ? 'Job Title' : '')}
                </span>
                <span className="item-date">
                  {exp.startDate || (showPlaceholders ? 'Start' : '')} -{' '}
                  {exp.endDate || (showPlaceholders ? 'End' : '')}
                </span>
              </div>
              <div className="item-subtitle">
                <span>{exp.company || (showPlaceholders ? 'Company' : '')}</span>
                <span>{exp.location}</span>
              </div>
              {exp.bullets.filter((b) => b.trim()).length > 0 && (
                <ul className="bullets">
                  {exp.bullets
                    .filter((b) => b.trim())
                    .map((bullet, i) => (
                      <li key={i}>{bullet}</li>
                    ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="section">
          <h2 className="section-title">Education</h2>
          {education.map((edu) => (
            <div key={edu.id} className="education-item">
              <div className="item-header">
                <span className="item-title">
                  {edu.degree || (showPlaceholders ? 'Degree' : '')}
                </span>
                <span className="item-date">
                  {edu.startDate || (showPlaceholders ? 'Start' : '')} -{' '}
                  {edu.endDate || (showPlaceholders ? 'End' : '')}
                </span>
              </div>
              <div className="item-subtitle">
                <span>{edu.institution || (showPlaceholders ? 'Institution' : '')}</span>
                <span>{edu.location}</span>
              </div>
              {edu.description && <p>{edu.description}</p>}
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="section">
          <h2 className="section-title">Skills</h2>
          <div className="skills-list">
            {skills.map((skill, i) => (
              <span key={i} className="skill-item">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Languages */}
      {languages.length > 0 && (
        <section className="section">
          <h2 className="section-title">Languages</h2>
          <div className="languages-list">
            {languages
              .filter((l) => l.name)
              .map((lang) => `${lang.name}: ${lang.level ? `${lang.level}` : ''}`)
              .join(', ')}
          </div>
        </section>
      )}

      {/* Empty state */}
      {showPlaceholders &&
        !personalInfo.fullName &&
        workExperience.length === 0 &&
        education.length === 0 &&
        skills.length === 0 &&
        languages.length === 0 && (
          <div className="empty-state">
            <p>Start filling in your information on the left</p>
            <p>to see your resume preview here.</p>
          </div>
        )}
    </div>
  );
}
