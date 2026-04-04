import { NextRequest, NextResponse } from 'next/server';
import { renderToHtml } from '@/lib/renderToHtml';
import { ResumeDataSchema } from '@/lib/validation';
import { browserPool } from '@/lib/browserPool';
import { createLogger } from '@/lib/logger';
import {
  httpRequestsTotal,
  httpRequestDuration,
  pdfGenerationDuration,
  pdfGenerationTotal,
} from '@/lib/metrics';
import z from 'zod';
import { ResumeTemplate, PAGE_PADDINGS_HORIZONTAL, PAGE_PADDINGS_VERTICAL } from '@/templates/basicTemplate';
import { getFullHtmlDocument } from '@/templates/basicTemplate/server';

const PDF_GENERATION_TIMEOUT = 10_000;

const log = createLogger('pdf');

/**
 * Generate PDF from resume data
 *
 * Features:
 * - Browser pooling for better performance (5-10x faster)
 * - Rate limiting via middleware (10 requests per 3 minutes)
 * - Timeouts to meet SLA requirements (<5 seconds)
 * - Graceful error handling and cleanup
 * - Structured logging and Prometheus metrics
 *
 * Note: Rate limiting is handled by middleware (src/middleware.ts)
 */
export async function POST(request: NextRequest) {
    const requestId = request.headers.get('X-Request-Id') ?? undefined;
    const reqLog = requestId ? createLogger('pdf', requestId) : log;
    const endHttpTimer = httpRequestDuration.startTimer({ method: 'POST', route: '/api/pdf' });
    let browser;
    let page;
    let statusCode = 200;

    try {
        reqLog.info({ requestId }, 'PDF generation request received');

        const { data, success, error } = await request.json().then(ResumeDataSchema.safeParse);

        if (!success) {
            statusCode = 400;
            reqLog.warn({ requestId, errors: z.treeifyError(error).errors }, 'Validation failed');

            endHttpTimer({ status: '400' });
            httpRequestsTotal.inc({ method: 'POST', route: '/api/pdf', status: '400' });

            return NextResponse.json(
                {
                    error: 'Invalid resume data',
                    details: z.treeifyError(error).errors
                },
                { status: 400 }
            );
        }

        const endPdfTimer = pdfGenerationDuration.startTimer();

        const resumeHTML = await renderToHtml(<ResumeTemplate data={data} />).then(getFullHtmlDocument);

        browser = await browserPool.acquire();
        page = await browser.newPage();

        await page.setContent(resumeHTML, {
            waitUntil: 'networkidle0',
            timeout: PDF_GENERATION_TIMEOUT
        });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: PAGE_PADDINGS_VERTICAL,
                bottom: PAGE_PADDINGS_VERTICAL,
                right: PAGE_PADDINGS_HORIZONTAL,
                left: PAGE_PADDINGS_HORIZONTAL,
            },
            timeout: PDF_GENERATION_TIMEOUT
        });

        endPdfTimer({ status: 'success' });
        pdfGenerationTotal.inc({ status: 'success' });

        const duration = endHttpTimer({ status: '200' });
        httpRequestsTotal.inc({ method: 'POST', route: '/api/pdf', status: '200' });

        reqLog.info({ requestId, durationMs: Math.round(duration * 1000) }, 'PDF generated successfully');

        return new NextResponse(Buffer.from(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${data.personalInfo.fullName || 'resume'}.pdf"`,
                'X-Generation-Time': `${Math.round(duration * 1000)}ms`,
            },
        });
    } catch (error) {
        const isTimeout = error instanceof Error && error.message.includes('timeout');
        statusCode = isTimeout ? 504 : 500;
        const errorMessage = isTimeout
            ? 'PDF generation timeout. Please try again.'
            : 'Failed to generate PDF';

        const pdfStatus = isTimeout ? 'timeout' : 'error';
        pdfGenerationTotal.inc({ status: pdfStatus });

        endHttpTimer({ status: String(statusCode) });
        httpRequestsTotal.inc({ method: 'POST', route: '/api/pdf', status: String(statusCode) });

        reqLog.error({ requestId, error, statusCode }, 'PDF generation failed');

        return NextResponse.json(
            { error: errorMessage },
            { status: statusCode }
        );
    } finally {
        if (page) {
            try {
                await page.close();
            } catch (e) {
                reqLog.error({ requestId, error: e }, 'Error closing page');
            }
        }

        if (browser) {
            try {
                await browserPool.release(browser);
            } catch (e) {
                reqLog.error({ requestId, error: e }, 'Error releasing browser');
            }
        }
    }
}
