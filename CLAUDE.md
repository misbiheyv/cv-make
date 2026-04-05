# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Resume Builder — a Next.js 15 (App Router) application for creating resumes with real-time preview and server-side PDF generation via Puppeteer. Uses React 19, TypeScript 5.7, Tailwind CSS 4, Zustand for state, and Biome for linting/formatting.

## Commands

| Task | Command |
|---|---|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Lint + fix | `npm run lint:fix` |
| Typecheck | `npm run typecheck` |
| Unit tests | `npm run test` |
| Integration tests | `npm run test:integration` |
| All tests | `npm run test:all` |
| Run single test file | `npx vitest run tests/unit/metrics.test.ts` |
| Run tests matching name | `npx vitest run -t "test name pattern"` |
| Docker (full stack) | `docker compose up --build` |

## Code Style (Biome)

- **Indentation:** Tabs
- **Line width:** 100 characters
- **Quotes:** Single quotes (JS/TS)
- **Imports:** Auto-organized by Biome
- **Lint rules:** Biome recommended, with `noArrayIndexKey` disabled

## Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json and vitest.config.ts).

## Architecture

### Shared Template Pattern

A single React component (`src/templates/basicTemplate/ResumeTemplate.tsx`) is used for both the client-side live preview and server-side PDF generation. The server path uses `renderToStaticMarkup()` to produce HTML that Puppeteer renders into a PDF. This guarantees visual consistency between preview and export.

### PDF Generation Flow

`POST /api/pdf` → Zod validation → `renderToStaticMarkup()` → Puppeteer browser from pool → PDF buffer → response. The browser pool (`src/lib/browserPool.ts`) maintains reusable Puppeteer instances (configurable via `BROWSER_POOL_*` env vars) for 5-10x faster generation after cold start.

### State Management

Zustand store at `src/store/useResumeStore.ts` with localStorage persistence. Sections: PersonalInfo, WorkExperience[], Education[], skills[], languages[]. Each section has add/update/remove/move operations.

### Observability Stack

- **Logging:** Pino structured logging (`src/lib/logger.ts`) with child logger pattern for request-scoped context
- **Metrics:** Prometheus via prom-client (`src/lib/metrics.ts`) — HTTP, PDF generation, and browser pool metrics exposed at `/api/metrics`
- **Health:** `GET /api/health` returns status, uptime, memory, pool stats
- **Monitoring:** Prometheus + Grafana (via Docker Compose)

### Deployment

Blue-green deployment behind Nginx. Two app containers (`app-blue`, `app-green`) with upstream switching via symlinked config files in `nginx/`. Rate limiting handled at the Nginx layer with per-IP and global zones.

## Test Structure

- `tests/unit/` — Mocked Puppeteer, tests for browser pool, metrics, logger, API routes
- `tests/integration/` — Real Puppeteer, performance benchmarks with P95 metrics
- `tests/fixtures/test-data.ts` — Shared valid resume data
- `tests/helpers/http.ts` — HTTP test utilities

## Key API Routes

- `POST /api/pdf` — Generate PDF from resume data
- `GET /api/health` — Health check (used by Docker and blue-green deploy verification)
- `GET /api/metrics` — Prometheus metrics endpoint
