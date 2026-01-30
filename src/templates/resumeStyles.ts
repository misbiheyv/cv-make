// CSS styles for resume template - used both for preview and PDF generation
export const resumeStyles = `
.resume-container * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.resume-container ol, ul, menu {
  list-style: initial;
}

.resume-container {
  font-family: 'Times New Roman', Times, serif;
  font-size: 11pt;
  line-height: 1.4;
  color: #000;
  background: #fff;
}

.resume-container .resume {
  width: 210mm;
  min-height: 297mm;
  padding: 15mm 20mm;
  margin: 0 auto;
  background: #fff;
}

.resume-container .header {
  text-align: center;
  margin-bottom: 12px;
  border-bottom: 1px solid #000;
  padding-bottom: 12px;
}

.resume-container .name {
  font-size: 24pt;
  font-weight: bold;
  margin: 0 0 6px 0;
  letter-spacing: 1px;
}

.resume-container .contact-info {
  font-size: 10pt;
  color: #333;
}

.resume-container .summary {
  margin-bottom: 12px;
  text-align: justify;
}

.resume-container .summary p {
  margin: 0;
}

.resume-container .section {
  margin-bottom: 12px;
}

.resume-container .section-title {
  font-size: 12pt;
  font-weight: bold;
  text-transform: uppercase;
  border-bottom: 1px solid #000;
  margin: 0 0 8px 0;
  padding-bottom: 2px;
  letter-spacing: 0.5px;
}

.resume-container .experience-item,
.resume-container .education-item {
  margin-bottom: 10px;
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
  font-style: italic;
  font-size: 10pt;
}

.resume-container .item-subtitle {
  display: flex;
  justify-content: space-between;
  font-style: italic;
  margin-bottom: 4px;
}

.resume-container .bullets {
  margin: 0 0 0 18px;
  padding: 0;
}

.resume-container .bullets li {
  margin-bottom: 2px;
  text-align: justify;
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
}
`;

// Full HTML document wrapper for PDF generation
export function getFullHtmlDocument(bodyContent: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume</title>
  <style>${resumeStyles}</style>
</head>
<body class="resume-container">
  ${bodyContent}
</body>
</html>`;
}
