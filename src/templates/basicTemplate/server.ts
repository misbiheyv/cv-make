// PDF-specific styles (server-only)
import fs from 'node:fs';
import path from 'node:path';
import { styles } from './resumeStyles';

function getBase64FontFaces(): string {
	const fonts = [
		{ file: 'CMUSerif.woff2', style: 'normal', weight: 'normal' },
		{ file: 'CMUSerif-Bold.woff2', style: 'normal', weight: 'bold' },
		{ file: 'CMUSerif-Italic.woff2', style: 'italic', weight: 'normal' },
	];

	return fonts
		.map(({ file, style, weight }) => {
			const fontPath = path.join(process.cwd(), 'public', 'fonts', file);
			const base64 = fs.readFileSync(fontPath).toString('base64');

			return `@font-face {
      font-family: 'CMU Serif';
      font-style: ${style};
      font-weight: ${weight};
      src: url(data:font/woff2;base64,${base64}) format('woff2');
    }`;
		})
		.join('\n');
}

const pdfOverrides = `
.resume-container .resume {
  width: 100%;
  min-height: auto;
  padding: 0;
}
`;

export function getFullHtmlDocument(bodyContent: string): string {
	const pdfStyles = getBase64FontFaces() + styles + pdfOverrides;

	return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Resume</title>
      <style>${pdfStyles}</style>
    </head>
    <body class="resume-container">
      ${bodyContent}
    </body>
    </html>
  `;
}
