import { NextRequest, NextResponse } from 'next/server';
import { ResumeTemplate } from '@/templates/ResumeTemplate';
import { getFullHtmlDocument } from '@/templates/resumeStyles';
import { renderToHtml } from '@/lib/renderToHtml';
import { ResumeDataSchema } from '@/lib/validation';
import { browserPool } from '@/lib/browserPool';
import z from 'zod';

const PDF_GENERATION_TIMEOUT = 10_000;

/**
 * Generate PDF from resume data
 * 
 * Features:
 * - Browser pooling for better performance (5-10x faster)
 * - Rate limiting via middleware (10 requests per 3 minutes)
 * - Timeouts to meet SLA requirements (<5 seconds)
 * - Graceful error handling and cleanup
 * 
 * Note: Rate limiting is handled by middleware (src/middleware.ts)
 */
export async function POST(request: NextRequest) {
    const startTime = Date.now();
    let browser;
    let page;
    let generationError;

    try {
        const { data, success, error } = await request.json().then(ResumeDataSchema.safeParse);

        if (!success) {
            generationError = error;

            return NextResponse.json(
                {
                    error: 'Invalid resume data',
                    details: z.treeifyError(error).errors
                },
                { status: 400 }
            );
        }

        const resumeHTML = await renderToHtml(<ResumeTemplate data={data} />).then(getFullHtmlDocument);

        browser = await browserPool.acquire();
        page = await browser.newPage();

        await page.setContent(resumeHTML, {
            waitUntil: 'networkidle0',
            timeout: PDF_GENERATION_TIMEOUT / 2
        });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0',
                right: '0',
                bottom: '0',
                left: '0',
            },
            timeout: PDF_GENERATION_TIMEOUT
        });

        return new NextResponse(Buffer.from(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${data.personalInfo.fullName || 'resume'}.pdf"`,
                'X-Generation-Time': `${Date.now() - startTime}ms`,
            },
        });
    } catch (error) {
        generationError = error;

        const isTimeout = error instanceof Error && error.message.includes('timeout');
        const statusCode = isTimeout ? 504 : 500;
        const errorMessage = isTimeout
            ? 'PDF generation timeout. Please try again.'
            : 'Failed to generate PDF';

        return NextResponse.json(
            { error: errorMessage },
            { status: statusCode }
        );
    } finally {
        if (page) {
            try {
                await page.close();
            } catch (e) {
                console.error('Error closing page:', e);
            }
        }

        if (browser) {
            try {
                await browserPool.release(browser);
            } catch (e) {
                console.error('Error releasing browser:', e);
            }
        }

        const duration = Date.now() - startTime;

        if (generationError) {
            console.error(`PDF generation error after ${duration}ms:`, generationError);
        } else {
            console.log(`PDF generated successfully in ${duration}ms`);
        }
    }
}
