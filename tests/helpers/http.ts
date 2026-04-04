const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

export async function generatePdf(data: Record<string, unknown>): Promise<Response> {
  return fetch(`${BASE_URL}/api/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function getHealth(): Promise<Record<string, any>> {
  const res = await fetch(`${BASE_URL}/api/health`);
  return res.json();
}
