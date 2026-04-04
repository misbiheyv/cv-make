const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

export interface RequestOptions {
  ip?: string;
}

export async function generatePdf(
  data: Record<string, unknown>,
  options?: RequestOptions,
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options?.ip) {
    headers['X-Forwarded-For'] = options.ip;
  }
  return fetch(`${BASE_URL}/api/pdf`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
}

export async function getHealth(): Promise<Record<string, any>> {
  const res = await fetch(`${BASE_URL}/api/health`);
  return res.json();
}
