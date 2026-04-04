import { describe, it, expect } from 'vitest';
import { generatePdf, getHealth } from '../helpers/http';
import { VALID_RESUME_DATA, INVALID_RESUME_DATA } from '../fixtures/test-data';

describe('Browser Pool Integration', () => {
  describe('health endpoint', () => {
    it('returns pool stats with expected fields', async () => {
      const health = await getHealth();

      expect(health.status).toBeDefined();
      expect(health.browserPool).toBeDefined();
      expect(health.browserPool).toMatchObject({
        total: expect.any(Number),
        available: expect.any(Number),
        inUse: expect.any(Number),
        waiting: expect.any(Number),
        maxBrowsers: expect.any(Number),
        utilization: expect.stringMatching(/^\d+\.\d+%$/),
      });
    });
  });

  describe('PDF generation', () => {
    it('generates a PDF from valid resume data', async () => {
      const res = await generatePdf(VALID_RESUME_DATA);

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe('application/pdf');
      expect(res.headers.get('x-generation-time')).toMatch(/^\d+ms$/);

      const body = await res.arrayBuffer();
      expect(body.byteLength).toBeGreaterThan(0);
    });

    it('reuses browsers across sequential requests', async () => {
      const healthBefore = await getHealth();
      const initialTotal = healthBefore.browserPool.total;

      // Three sequential PDF generations
      for (let i = 0; i < 3; i++) {
        const res = await generatePdf(VALID_RESUME_DATA);
        expect(res.status).toBe(200);
      }

      const healthAfter = await getHealth();

      // Pool total should be stable (not growing unboundedly)
      expect(healthAfter.browserPool.total).toBeLessThanOrEqual(initialTotal + 1);
    });

    it('handles concurrent requests successfully', async () => {
      const requests = Array.from({ length: 5 }, () =>
        generatePdf(VALID_RESUME_DATA),
      );

      const responses = await Promise.all(requests);

      responses.forEach((res) => {
        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toBe('application/pdf');
      });
    });

    it('returns 400 for invalid data without impacting pool', async () => {
      const healthBefore = await getHealth();

      const res = await generatePdf(INVALID_RESUME_DATA);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid resume data');

      const healthAfter = await getHealth();
      expect(healthAfter.browserPool.total).toBe(healthBefore.browserPool.total);
    });
  });

  describe('pool lifecycle', () => {
    it('shows in-use browsers during concurrent load', async () => {
      // Fire off requests but DON'T await them yet
      const requests = Array.from({ length: 5 }, () =>
        generatePdf(VALID_RESUME_DATA),
      );

      // Check health while requests are in-flight
      // Small delay to ensure requests have started
      await new Promise((r) => setTimeout(r, 200));
      const healthDuring = await getHealth();

      expect(healthDuring.browserPool.inUse).toBeGreaterThan(0);

      // Now await all requests to complete
      await Promise.all(requests);
    });

    it('returns all browsers to pool after requests complete', async () => {
      // Generate several PDFs
      const requests = Array.from({ length: 3 }, () =>
        generatePdf(VALID_RESUME_DATA),
      );
      await Promise.all(requests);

      // Delay for release to propagate
      await new Promise((r) => setTimeout(r, 5000));

      const health = await getHealth();

      expect(health.browserPool.inUse).toBe(0);
      expect(health.browserPool.available).toBe(health.browserPool.total);
    });
  });
});
