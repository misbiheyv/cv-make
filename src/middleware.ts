import { NextRequest, NextResponse } from 'next/server';
import { pdfRateLimiter } from '@/lib/rateLimit';

export const runtime = 'nodejs';

function getIdentifier(request: NextRequest): string {
  // Check x-forwarded-for (common behind proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Check x-real-ip (alternative proxy header)
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Fallback to anonymous (should rarely happen)
  return 'anonymous';
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/api/pdf') {
    try {
      const identifier = getIdentifier(request);
      const result = await pdfRateLimiter.check(identifier);

      const headers = new Headers();
      headers.set('X-RateLimit-Limit', result.limit.toString());
      headers.set('X-RateLimit-Remaining', result.remaining.toString());
      headers.set('X-RateLimit-Reset', result.reset.toISOString());

      if (!result.success) {
        const retryAfter = Math.ceil((result.reset.getTime() - Date.now()) / 1000);
        headers.set('Retry-After', retryAfter.toString());

        console.warn(`Rate limit exceeded for ${identifier}`);

        return NextResponse.json(
          {
            error: 'Too many requests',
            message: 'You have exceeded the rate limit. Please try again later.',
            retryAfter,
          },
          { status: 429, headers }
        );
      }

      const response = NextResponse.next();
      headers.forEach((value, key) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      // Log error but allow request to proceed (fail-open)
      console.error('Middleware error:', error);
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/pdf'],
};
