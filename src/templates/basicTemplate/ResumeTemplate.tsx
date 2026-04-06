import type { ResumeData } from '@/types/resume';

interface ResumeTemplateProps {
	data: ResumeData;
	showPlaceholders?: boolean;
}

export function ResumeTemplate({ data, showPlaceholders = false }: ResumeTemplateProps) {
	const { personalInfo, workExperience, education, skills, languages } = data;
	const contactParts = personalInfo.links.filter(Boolean);
	const infoParts = [personalInfo.phone, personalInfo.city].filter(Boolean);

	return (
		<div className="resume">
			{/* Header */}
			<header className="header">
				<h1 className="name">{personalInfo.fullName || (showPlaceholders ? 'Your Name' : '')}</h1>
				{infoParts.length > 0 && <div className="contact-info">{infoParts.join(' | ')}</div>}
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
					<h2 className="section-title">Summary</h2>
					<div className="section-body">
						<p>{personalInfo.summary}</p>
					</div>
				</section>
			)}

			{/* Work Experience */}
			{workExperience.length > 0 && (
				<section className="section">
					<h2 className="section-title">Experience</h2>
					<div className="section-body">
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
					</div>
				</section>
			)}

			{/* Education */}
			{education.length > 0 && (
				<section className="section">
					<h2 className="section-title">Education</h2>
					<div className="section-body">
						{education.map((edu) => (
							<div key={edu.id} className="education-item">
								<div className="item-header">
									<span className="item-title">
										{edu.institution || (showPlaceholders ? 'Institution' : '')}
									</span>
									<span className="item-date">{edu.location}</span>
								</div>
								<div className="item-subtitle">
									<span>{edu.degree || (showPlaceholders ? 'Degree' : '')}</span>
									<span>
										{edu.startDate || (showPlaceholders ? 'Start' : '')} -{' '}
										{edu.endDate || (showPlaceholders ? 'End' : '')}
									</span>
								</div>
								{edu.description && <p>{edu.description}</p>}
							</div>
						))}
					</div>
				</section>
			)}

			{/* Skills */}
			{skills.length > 0 && (
				<section className="section">
					<h2 className="section-title">Technical skills</h2>
					<div className="section-body">
						<div className="skills-list">
							{skills.map((skill) => (
								<div key={skill.id} className="skill-item">
									<b>{skill.name}</b>: {skill.description}
								</div>
							))}
						</div>
					</div>
				</section>
			)}

			{/* Languages */}
			{languages.length > 0 && (
				<section className="section">
					<h2 className="section-title">Languages</h2>
					<div className="section-body">
						<div className="languages-list">
							{languages
								.filter((l) => l.name)
								.map((lang) => (
									<div key={lang.id}>
										<b>{lang.name}</b>: {lang.level}
									</div>
								))}
						</div>
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
