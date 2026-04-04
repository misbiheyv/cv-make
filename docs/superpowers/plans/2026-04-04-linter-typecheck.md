# Linter, Formatter & TypeScript Error Checker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Biome for linting + formatting, TypeScript error checking (`tsc --noEmit`), and a GitHub Actions CI pipeline with parallel lint/typecheck/test jobs. Replaces `next lint`.

**Architecture:** Three changes — Biome config + updated npm scripts, a `typecheck` script, and a CI workflow with three parallel jobs.

**Tech Stack:** Biome, TypeScript compiler, GitHub Actions

---

### Task 1: Add Biome for linting and formatting

**Files:**
- Create: `biome.json`
- Modify: `package.json` (devDependencies, scripts)
- Delete: `.eslintrc.json` (if it exists)

- [ ] **Step 1: Install Biome**

Run:
```bash
npm install --save-dev --save-exact @biomejs/biome
```

- [ ] **Step 2: Create `biome.json`**

Create `biome.json` at the project root:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single"
    }
  },
  "css": {
    "formatter": {
      "enabled": true
    },
    "linter": {
      "enabled": true
    }
  }
}
```

- [ ] **Step 3: Update npm scripts in `package.json`**

Replace the `"lint"` script and add `"lint:fix"`:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "biome check src/",
  "lint:fix": "biome check --write src/",
  "typecheck": "tsc --noEmit",
  "test": "vitest run tests/unit",
  "test:integration": "vitest run tests/integration --test-timeout 30000",
  "test:all": "vitest run tests --test-timeout 30000"
}
```

Note: This also adds the `typecheck` script from Task 2 — it's simpler to do both script changes at once.

- [ ] **Step 4: Remove `.eslintrc.json` if it exists**

```bash
rm -f .eslintrc.json
```

- [ ] **Step 5: Run `npm run lint` to verify Biome works**

Run:
```bash
npm run lint
```

Expected: Biome runs and reports any lint/format issues. The command itself should not error out (config is valid). It will likely report formatting issues in existing code.

- [ ] **Step 6: Auto-fix existing issues**

Run:
```bash
npm run lint:fix
```

Then re-run `npm run lint` to verify everything is clean. If there are remaining errors that can't be auto-fixed, fix them manually.

- [ ] **Step 7: Commit**

```bash
git add biome.json package.json package-lock.json src/
git commit -m "feat: add Biome for linting and formatting

Replace next lint with Biome. Auto-fix existing code to match Biome rules."
```

---

### Task 2: Verify TypeScript type checking

**Files:**
- None new (typecheck script already added in Task 1)

- [ ] **Step 1: Run the typecheck**

Run:
```bash
npm run typecheck
```

Expected: Exits with code 0 (no type errors), or reports existing type errors.

- [ ] **Step 2: Fix any type errors**

If Step 1 reported errors, fix them. Re-run `npm run typecheck` after each fix until it exits cleanly.

- [ ] **Step 3: Commit (only if fixes were needed)**

```bash
git add src/
git commit -m "fix: resolve existing TypeScript type errors"
```

---

### Task 3: Add GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflow file**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint

  typecheck:
    name: Typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run typecheck

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run test:all
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "feat: add GitHub Actions CI with parallel lint, typecheck, and test jobs"
```
