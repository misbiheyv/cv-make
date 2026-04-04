// CSS styles for resume template - preview and shared styles

export const PAGE_PADDINGS_VERTICAL = '8mm';
export const PAGE_PADDINGS_HORIZONTAL = '8mm';

const fonts = `
@font-face {
  font-family: 'CMU Serif';
  font-style: normal;
  font-weight: normal;
  font-display: swap;
  src: url('/fonts/CMUSerif.woff2') format('woff2');
}
@font-face {
  font-family: 'CMU Serif';
  font-style: normal;
  font-weight: bold;
  font-display: swap;
  src: url('/fonts/CMUSerif-Bold.woff2') format('woff2');
}
@font-face {
  font-family: 'CMU Serif';
  font-style: italic;
  font-weight: normal;
  font-display: swap;
  src: url('/fonts/CMUSerif-Italic.woff2') format('woff2');
}`;

export const styles = `
.resume-container * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.resume-container ol, ul, menu {
  list-style: initial;
}

.resume-container {
  font-family: 'CMU Serif', 'Times New Roman', Times, serif;
  font-size: 14px;
  line-height: 1.15;
  color: #000;
  background: #fff;
}

.resume-container .resume {
  width: 215.9mm;
  min-height: 279.4mm;
  padding: ${PAGE_PADDINGS_VERTICAL} ${PAGE_PADDINGS_HORIZONTAL};
  margin: 0 auto;
  background: #fff;
}

.resume-container .header {
  text-align: center;
  margin-bottom: 8px;
  border-bottom: 1px solid #000;
  padding-bottom: 8px;
}

.resume-container .name {
  font-size: 24pt;
  font-weight: bold;
  margin: 0 0 6px 0;
  letter-spacing: 1px;
}

.resume-container .contact-info {
  font-size: 10pt;
  color: #000;
}

.resume-container .contact-info + .contact-info {
  margin-top: 2px;
}

.resume-container .summary {
  margin-bottom: 12px;
}

.resume-container .summary p {
  margin: 0;
}

.resume-container .section {
  margin-bottom: 6px;
}

.resume-container .section-title {
  font-size: 12pt;
  font-variant: small-caps;
  border-bottom: 1px solid #000;
  margin: 0 0 4px 0;
  padding-bottom: 2px;
}

.resume-container .experience-item,
.resume-container .education-item {
  margin-bottom: 5px;
}

.resume-container .item-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 2px;
}

.resume-container .item-title {
  font-weight: bold;
}

.resume-container .item-date {
  font-size: 10pt;
}

.resume-container .item-subtitle {
  display: flex;
  justify-content: space-between;
  font-size: 10pt;
  font-style: italic;
  margin-bottom: 2px;
}

.resume-container .bullets {
  margin: 0 0 0 18px;
  padding: 0;
}

.resume-container .bullets li {
  margin-bottom: 1px;
}

.resume-container .bullets li::marker {
  font-size: 0.6em;
}

.resume-container .skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  font-size: 10pt;
}

.resume-container .languages-list {
  font-size: 10pt;
}

.resume-container .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #999;
  text-align: center;
}

.resume-container .empty-state p {
  margin: 4px 0;
}`;

export const resumeStyles = fonts + styles;
