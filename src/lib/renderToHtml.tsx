import type { ReactElement } from 'react';

export async function renderToHtml(element: ReactElement): Promise<string> {
	const { renderToStaticMarkup } = await import('react-dom/server');
	return renderToStaticMarkup(element);
}
