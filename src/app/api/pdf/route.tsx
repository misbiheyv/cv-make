import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { ResumeTemplate } from '@/templates/ResumeTemplate';
import { getFullHtmlDocument } from '@/templates/resumeStyles';
import { renderToHtml } from '@/lib/renderToHtml';
import { ResumeDataSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const rawData = await request.json();
    
    // Validate with Zod
    const validationResult = ResumeDataSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid resume data',
          details: validationResult.error.format()
        },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;

    // Render React component to static HTML
    const resumeHTML = await renderToHtml(<ResumeTemplate data={data} />);
    
    // Wrap in full HTML document with styles
    const fullHTML = getFullHtmlDocument(resumeHTML);
    
    // Generate PDF with Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    try {
      const page = await browser.newPage();
      await page.setContent(fullHTML, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
        },
      });
      
      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${data.personalInfo.fullName || 'resume'}.pdf"`,
        },
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
