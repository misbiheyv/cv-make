import type { ResumeData } from '@/types/resume';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderResumeToHtml(data: ResumeData): string {
  const { personalInfo, workExperience, education, skills, languages } = data;

  const contactParts = [
    personalInfo.phone,
    personalInfo.email,
    personalInfo.linkedin,
    personalInfo.github,
  ].filter(Boolean);

  let html = '<div class="resume">';

  // Header
  html += '<header class="header">';
  html += `<h1 class="name">${escapeHtml(personalInfo.fullName || '')}</h1>`;
  html += `<div class="contact-info">${escapeHtml(contactParts.join(' | '))}</div>`;
  html += '</header>';

  // Summary
  if (personalInfo.summary) {
    html += '<section class="summary">';
    html += `<p>${escapeHtml(personalInfo.summary)}</p>`;
    html += '</section>';
  }

  // Work Experience
  if (workExperience.length > 0) {
    html += '<section class="section">';
    html += '<h2 class="section-title">Work Experience</h2>';
    for (const exp of workExperience) {
      html += '<div class="experience-item">';
      html += '<div class="item-header">';
      html += `<span class="item-title">${escapeHtml(exp.title || '')}</span>`;
      html += `<span class="item-date">${escapeHtml(exp.startDate || '')} - ${escapeHtml(exp.endDate || '')}</span>`;
      html += '</div>';
      html += '<div class="item-subtitle">';
      html += `<span>${escapeHtml(exp.company || '')}</span>`;
      html += `<span>${escapeHtml(exp.location || '')}</span>`;
      html += '</div>';
      const filteredBullets = exp.bullets.filter((b) => b.trim());
      if (filteredBullets.length > 0) {
        html += '<ul class="bullets">';
        for (const bullet of filteredBullets) {
          html += `<li>${escapeHtml(bullet)}</li>`;
        }
        html += '</ul>';
      }
      html += '</div>';
    }
    html += '</section>';
  }

  // Education
  if (education.length > 0) {
    html += '<section class="section">';
    html += '<h2 class="section-title">Education</h2>';
    for (const edu of education) {
      html += '<div class="education-item">';
      html += '<div class="item-header">';
      html += `<span class="item-title">${escapeHtml(edu.degree || '')}</span>`;
      html += `<span class="item-date">${escapeHtml(edu.startDate || '')} - ${escapeHtml(edu.endDate || '')}</span>`;
      html += '</div>';
      html += '<div class="item-subtitle">';
      html += `<span>${escapeHtml(edu.institution || '')}</span>`;
      html += `<span>${escapeHtml(edu.location || '')}</span>`;
      html += '</div>';
      if (edu.description) {
        html += `<p>${escapeHtml(edu.description)}</p>`;
      }
      html += '</div>';
    }
    html += '</section>';
  }

  // Skills
  if (skills.length > 0) {
    html += '<section class="section">';
    html += '<h2 class="section-title">Skills</h2>';
    html += '<div class="skills-list">';
    for (const skill of skills) {
      html += `<span class="skill-item">${escapeHtml(skill)}</span>`;
    }
    html += '</div>';
    html += '</section>';
  }

  // Languages
  if (languages.length > 0) {
    html += '<section class="section">';
    html += '<h2 class="section-title">Languages</h2>';
    html += '<div class="languages-list">';
    const langStrings = languages
      .filter((l) => l.name)
      .map((lang) => `${lang.name}${lang.level ? ` (${lang.level})` : ''}`);
    html += escapeHtml(langStrings.join(', '));
    html += '</div>';
    html += '</section>';
  }

  html += '</div>';

  return html;
}
