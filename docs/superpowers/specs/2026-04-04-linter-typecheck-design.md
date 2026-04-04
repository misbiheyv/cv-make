# Linter, Formatter & TypeScript Error Checker

## Overview

Add linting and formatting via Biome, TypeScript error checking via `tsc --noEmit`, and a GitHub Actions CI pipeline that runs lint, typecheck, and tests on push to main and PRs. Replaces the existing `next lint` script entirely.

## npm Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `lint` | `biome check src/` | Lint + format check (replaces `next lint`) |
| `lint:fix` | `biome check --write src/` | Auto-fix lint + format issues |
| `typecheck` | `tsc --noEmit` | TypeScript error checking |

All scripts exit non-zero on errors for CI gating.

## Biome Configuration

Add `biome.json` at project root:

- Use `recommended` rules preset
- Configured for TypeScript + JSX
- Tailwind CSS class sorting enabled (via `useSortedClasses` rule)
- Formatter: tabs or spaces per project convention, line width 80-100

## GitHub Actions CI

Single workflow file: `.github/workflows/ci.yml`

- **Triggers:** push to `main`, pull requests
- **Runner:** `ubuntu-latest`, Node 20
- **3 parallel jobs**, each does checkout + `npm ci` + its task:
  - **lint** — `npm run lint`
  - **typecheck** — `npm run typecheck`
  - **test** — `npm run test:all`
- All jobs run independently — a lint failure doesn't block tests from running
