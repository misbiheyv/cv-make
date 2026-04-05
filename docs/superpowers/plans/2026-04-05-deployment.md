# Blue-Green Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up zero-downtime blue-green deployments to a Hetzner VPS, triggered manually from GitHub Actions.

**Architecture:** Two identical app services (`app-blue`, `app-green`) behind Nginx. A deploy script starts the idle color, health-checks it, swaps the Nginx upstream, drains the old color, and stops it. CI builds and pushes images to GHCR. A CD workflow SSHes into the server to run the deploy script.

**Tech Stack:** Docker Compose, Nginx, GitHub Actions, GitHub Container Registry, Bash

---

### Task 1: Create Nginx Upstream Config Files

**Files:**
- Create: `nginx/upstream-blue.conf`
- Create: `nginx/upstream-green.conf`
- Create: `nginx/upstream.conf`

These three files define the Nginx upstream blocks for blue-green switching. `upstream.conf` is the active config — the deploy script overwrites it with the content of whichever color is being activated. `upstream-blue.conf` and `upstream-green.conf` are reference copies used by the deploy script.

- [ ] **Step 1: Create upstream-blue.conf**

Create `nginx/upstream-blue.conf`:

```nginx
upstream app {
    server app-blue:3000;
}
```

- [ ] **Step 2: Create upstream-green.conf**

Create `nginx/upstream-green.conf`:

```nginx
upstream app {
    server app-green:3000;
}
```

- [ ] **Step 3: Create upstream.conf (default to blue)**

Create `nginx/upstream.conf` — this is the active upstream config. Initially points to blue for first deploy:

```nginx
upstream app {
    server app-blue:3000;
}
```

- [ ] **Step 4: Commit**

```bash
git add nginx/upstream-blue.conf nginx/upstream-green.conf nginx/upstream.conf
git commit -m "feat: add nginx upstream configs for blue-green deployment"
```

---

### Task 2: Update docker-compose.yml for Blue-Green

**Files:**
- Modify: `docker-compose.yml`

The current single `app` service becomes two: `app-blue` and `app-green`. A YAML anchor (`x-app-common`) avoids duplication. All `container_name` directives are removed. The Nginx service gets a new volume mount for `upstream.conf` and loses its `depends_on` for the app (the deploy script manages startup order). Prometheus also loses its `depends_on` for the app. Both app services support building locally (for dev) and pulling pre-built images (for production).

- [ ] **Step 1: Replace the entire docker-compose.yml**

Replace the contents of `docker-compose.yml` with:

```yaml
x-app-common: &app-common
  build:
    context: .
    dockerfile: Dockerfile
    target: runner
  image: ${IMAGE_NAME:-resume-app}:${IMAGE_TAG:-latest}
  restart: unless-stopped
  environment:
    - NODE_ENV=${NODE_ENV:-production}
    - LOG_LEVEL=${LOG_LEVEL:-info}
    - BROWSER_POOL_MIN=${BROWSER_POOL_MIN}
    - BROWSER_POOL_MAX=${BROWSER_POOL_MAX}
    - BROWSER_POOL_IDLE_TIMEOUT_MS=${BROWSER_POOL_IDLE_TIMEOUT_MS}
    - PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
  networks:
    - resume_network
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '0.5'
        memory: 512M

services:
  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "${NGINX_PORT:-3000}:80"
      - "${NGINX_SSL_PORT:-443}:443"
    volumes:
      - ${NGINX_CONFIG_PATH:-./nginx/nginx.conf}:/etc/nginx/templates/default.conf.template:ro
      - ./nginx/upstream.conf:/etc/nginx/conf.d/upstream.conf
      - ${SSL_CERT_PATH:-/etc/letsencrypt}:/etc/letsencrypt:ro
    environment:
      - RATE_LIMIT=${RATE_LIMIT}
      - RATE_BURST=${RATE_BURST}
      - GLOBAL_RATE_LIMIT=${GLOBAL_RATE_LIMIT}
      - GLOBAL_RATE_BURST=${GLOBAL_RATE_BURST}
      - DOMAIN=${DOMAIN:-localhost}
      - NGINX_ENVSUBST_VARS=RATE_LIMIT,RATE_BURST,GLOBAL_RATE_LIMIT,GLOBAL_RATE_BURST,DOMAIN
    networks:
      - resume_network

  app-blue:
    <<: *app-common

  app-green:
    <<: *app-common

  prometheus:
    image: prom/prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    networks:
      - resume_network

  grafana:
    image: grafana/grafana
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-admin}
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - ./grafana/dashboards:/var/lib/grafana/dashboards:ro
      - grafana_data:/var/lib/grafana
    depends_on:
      - prometheus
    networks:
      - resume_network

  nginx-exporter:
    image: nginx/nginx-prometheus-exporter
    restart: unless-stopped
    command:
      - '--nginx.scrape-uri=http://nginx:80/nginx_status'
    depends_on:
      - nginx
    networks:
      - resume_network

networks:
  resume_network:
    driver: bridge

volumes:
  prometheus_data:
  grafana_data:
```

Key changes from the current file:
- Removed `version: '3.8'` (deprecated in modern Docker Compose)
- Added `x-app-common` YAML anchor shared by both app services
- Replaced `app` service with `app-blue` and `app-green` (both using the anchor)
- Removed all `container_name` directives
- Added `IMAGE_NAME` and `IMAGE_TAG` env vars for pulling pre-built images
- Added `upstream.conf` volume mount to nginx
- Added SSL cert volume mount (`/etc/letsencrypt`) to nginx
- Added `DOMAIN` env var and `NGINX_SSL_PORT` port mapping to nginx
- Removed `depends_on` from nginx and prometheus for app (deploy script manages ordering)
- Changed nginx config path default to `./nginx/nginx.conf`

- [ ] **Step 2: Verify compose file is valid**

Run: `docker compose config --quiet`
Expected: no output (exit code 0). If it prints errors, the YAML is invalid.

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: split app into blue-green services, remove container names"
```

---

### Task 3: Update Production Nginx Config

**Files:**
- Modify: `nginx/nginx.conf`

The production nginx config adds SSL termination, HTTP-to-HTTPS redirect, and changes `proxy_pass` from `http://app:3000` to `http://app` (referencing the upstream block defined in `upstream.conf`, which is auto-included by nginx via `/etc/nginx/conf.d/*.conf`).

- [ ] **Step 1: Replace nginx/nginx.conf with the production config**

Replace the contents of `nginx/nginx.conf` with:

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=${RATE_LIMIT};
limit_req_zone $server_name zone=global:1m rate=${GLOBAL_RATE_LIMIT};

# HTTP → HTTPS redirect (production)
# In development, only port 80 is used — HTTPS block is inactive without certs
server {
    listen 80;
    server_name _;

    # Health check available over HTTP (for load balancers, deploy script)
    location /api/health {
        proxy_pass http://app;
    }

    # Redirect everything else to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name ${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location /nginx_status {
        stub_status;
        allow 172.0.0.0/8;
        allow 10.0.0.0/8;
        deny all;
    }

    location /api/pdf {
        limit_req zone=global burst=${GLOBAL_RATE_BURST} nodelay;
        limit_req zone=api burst=${RATE_BURST} nodelay;
        limit_req_status 429;

        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-Id $request_id;

        proxy_read_timeout 30s;
        proxy_send_timeout 30s;
    }

    location / {
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-Id $request_id;
    }

    error_page 429 @rate_limited;
    location @rate_limited {
        default_type application/json;
        add_header Retry-After 1 always;
        return 429 '{"error":"Too many requests","message":"You have exceeded the rate limit. Please try again later."}';
    }
}
```

Key changes:
- `proxy_pass http://app:3000` → `proxy_pass http://app` (uses upstream block, which includes the port)
- Added HTTPS server block with SSL termination
- Added HTTP→HTTPS redirect (port 80 only serves `/api/health` for deploy script health checks)
- Added `${DOMAIN}` for server_name and cert paths (substituted by nginx envsubst)

- [ ] **Step 2: Commit**

```bash
git add nginx/nginx.conf
git commit -m "feat: add SSL termination and upstream-based routing to nginx config"
```

---

### Task 4: Update Local Dev Nginx Config

**Files:**
- Modify: `nginx/nginx.test.conf`

The test/dev config still uses direct `proxy_pass` (no upstream block needed for local dev). Update the hostname from `app` to `app-blue` since the service was renamed.

- [ ] **Step 1: Update proxy_pass targets in nginx.test.conf**

In `nginx/nginx.test.conf`, replace all occurrences of `proxy_pass http://app:3000` with `proxy_pass http://app-blue:3000`.

There are two occurrences:
- Line 23 (inside `location /api/pdf`)
- Line 35 (inside `location /`)

- [ ] **Step 2: Commit**

```bash
git add nginx/nginx.test.conf
git commit -m "fix: update nginx test config to use app-blue service name"
```

---

### Task 5: Update Prometheus Config

**Files:**
- Modify: `prometheus/prometheus.yml`

Add both blue and green targets. Prometheus gracefully handles unreachable targets (marks them `up=0`), so only the active container responds.

- [ ] **Step 1: Update the resume-app scrape target**

In `prometheus/prometheus.yml`, replace the `targets` line in the `resume-app` job:

```yaml
      - targets: ['app:3000']
```

with:

```yaml
      - targets: ['app-blue:3000', 'app-green:3000']
```

- [ ] **Step 2: Commit**

```bash
git add prometheus/prometheus.yml
git commit -m "feat: scrape both blue and green app targets in prometheus"
```

---

### Task 6: Create Deploy Script

**Files:**
- Create: `scripts/deploy.sh`

The deploy script orchestrates the blue-green swap. It reads the current active color from a state file, starts the idle color with the new image, health-checks it, swaps the nginx upstream, drains in-flight requests, and stops the old color.

- [ ] **Step 1: Create scripts directory**

Run: `mkdir -p scripts`

- [ ] **Step 2: Create scripts/deploy.sh**

Create `scripts/deploy.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Blue-green deploy script for resume-builder
# Usage: ./scripts/deploy.sh <tag>
# Example: ./scripts/deploy.sh abc1234
# IMAGE_NAME must be set in .env (e.g. ghcr.io/user/resume)

DEPLOY_DIR="/opt/resume"
STATE_FILE="${DEPLOY_DIR}/active-color"
HEALTH_TIMEOUT=60
HEALTH_INTERVAL=2
DRAIN_TIMEOUT=15

IMAGE_TAG="${1:?Usage: deploy.sh <tag>}"

log() {
    echo "[$(date -Iseconds)] $*"
}

# Determine current and next color
if [ -f "$STATE_FILE" ]; then
    CURRENT=$(cat "$STATE_FILE")
    if [ "$CURRENT" = "blue" ]; then
        NEXT="green"
    else
        NEXT="blue"
    fi
    FIRST_DEPLOY=false
else
    CURRENT=""
    NEXT="blue"
    FIRST_DEPLOY=true
fi

cd "$DEPLOY_DIR"

log "Deploy starting: image=$IMAGE_TAG target=$NEXT"

# Export IMAGE_TAG so docker compose uses the new image
export IMAGE_TAG

# Pull the new image for the target service
log "Pulling image for app-${NEXT}..."
docker compose pull "app-${NEXT}"

# Start the new container
log "Starting app-${NEXT}..."
docker compose up -d "app-${NEXT}"

# Health check: poll every HEALTH_INTERVAL seconds for up to HEALTH_TIMEOUT seconds
log "Waiting for app-${NEXT} to become healthy..."
ATTEMPTS=$((HEALTH_TIMEOUT / HEALTH_INTERVAL))
HEALTHY=false

for i in $(seq 1 "$ATTEMPTS"); do
    if docker compose exec "app-${NEXT}" curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
        log "app-${NEXT} is healthy (attempt ${i}/${ATTEMPTS})"
        HEALTHY=true
        break
    fi
    sleep "$HEALTH_INTERVAL"
done

if [ "$HEALTHY" = false ]; then
    log "ERROR: app-${NEXT} failed health check after ${HEALTH_TIMEOUT}s"
    docker compose stop "app-${NEXT}"
    exit 1
fi

# Switch nginx upstream to the new color
log "Switching upstream to app-${NEXT}..."
echo "upstream app { server app-${NEXT}:3000; }" > nginx/upstream.conf
docker compose exec nginx nginx -s reload

log "Traffic switched to app-${NEXT}"

# Drain in-flight requests on old container, then stop it
if [ "$FIRST_DEPLOY" = false ]; then
    log "Draining app-${CURRENT} for ${DRAIN_TIMEOUT}s..."
    sleep "$DRAIN_TIMEOUT"
    docker compose stop "app-${CURRENT}"
    log "app-${CURRENT} stopped"
fi

# Update state file
echo "$NEXT" > "$STATE_FILE"

log "Deploy complete: app-${NEXT} is active (image: ${IMAGE_TAG})"
```

- [ ] **Step 3: Make the script executable**

Run: `chmod +x scripts/deploy.sh`

- [ ] **Step 4: Verify script syntax**

Run: `bash -n scripts/deploy.sh`
Expected: no output (exit code 0). This checks for syntax errors without executing.

- [ ] **Step 5: Commit**

```bash
git add scripts/deploy.sh
git commit -m "feat: add blue-green deploy script"
```

---

### Task 7: Create CD Workflow

**Files:**
- Create: `.github/workflows/cd.yml`

The CD workflow is triggered manually via `workflow_dispatch`. It builds the Docker image, pushes it to GHCR, SCPs updated config files to the Hetzner server, and runs the deploy script via SSH.

- [ ] **Step 1: Create .github/workflows/cd.yml**

Create `.github/workflows/cd.yml`:

```yaml
name: CD

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version tag (e.g. v1.0.0). Defaults to git SHA.'
        required: false
        type: string

env:
  IMAGE_NAME: ghcr.io/${{ github.repository }}

jobs:
  deploy:
    name: Build & Deploy
    runs-on: ubuntu-latest

    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Set image tag
        id: tag
        run: |
          if [ -n "${{ inputs.version }}" ]; then
            echo "tag=${{ inputs.version }}" >> "$GITHUB_OUTPUT"
          else
            echo "tag=${{ github.sha }}" >> "$GITHUB_OUTPUT"
          fi

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          target: runner
          tags: |
            ${{ env.IMAGE_NAME }}:${{ steps.tag.outputs.tag }}
            ${{ env.IMAGE_NAME }}:latest

      - name: Copy config files to server
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          source: >-
            docker-compose.yml,
            nginx/nginx.conf,
            nginx/upstream-blue.conf,
            nginx/upstream-green.conf,
            scripts/deploy.sh,
            prometheus/prometheus.yml,
            grafana/provisioning/,
            grafana/dashboards/
          target: /opt/resume
          overwrite: true

      - name: Run deploy script
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /opt/resume
            chmod +x scripts/deploy.sh
            ./scripts/deploy.sh "${{ steps.tag.outputs.tag }}"
```

Note: This workflow requires three GitHub Actions secrets to be configured:
- `DEPLOY_SSH_KEY` — private SSH key for the deploy user on the server
- `DEPLOY_HOST` — Hetzner server IP address or hostname
- `DEPLOY_USER` — SSH username on the server (e.g. `deploy`)

`GITHUB_TOKEN` is provided automatically and has `packages:write` permission for GHCR.

- [ ] **Step 2: Verify workflow YAML is valid**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/cd.yml'))" 2>/dev/null || npx yaml-lint .github/workflows/cd.yml`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/cd.yml
git commit -m "feat: add CD workflow with manual trigger for blue-green deploy"
```

---

### Task 8: Update .env.example

**Files:**
- Modify: `.env.example`

Add deployment-related environment variables so developers and the production server know what's configurable.

- [ ] **Step 1: Add deployment vars to .env.example**

Append the following to `.env.example`:

```dotenv

# deployment
# For production, set IMAGE_NAME to your GHCR path: ghcr.io/<user>/resume
IMAGE_NAME=resume-app
IMAGE_TAG=latest
DOMAIN=localhost
SSL_CERT_PATH=/etc/letsencrypt

# nginx ports
NGINX_PORT=3000
NGINX_SSL_PORT=443

# grafana
GRAFANA_ADMIN_PASSWORD=admin
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add deployment env vars to .env.example"
```

---

### Task 9: Local Validation

Verify the entire stack works locally with the blue-green setup before committing to production use.

- [ ] **Step 1: Verify compose config is valid**

Run: `docker compose config --quiet`
Expected: exit code 0, no output.

- [ ] **Step 2: Start the local dev stack**

Run: `NGINX_CONFIG_PATH=./nginx/nginx.test.conf docker compose up -d app-blue nginx prometheus grafana nginx-exporter`

This starts:
- `app-blue` (the Next.js app, built locally)
- `nginx` (reverse proxy using the test config)
- `prometheus`, `grafana`, `nginx-exporter` (monitoring stack)

Expected: all services start without errors. Check with `docker compose ps` — all listed services should show "running" or "healthy".

- [ ] **Step 3: Verify the app responds**

Run: `curl -sf http://localhost:3000/api/health | python3 -m json.tool`
Expected: JSON response with `"status": "healthy"`.

- [ ] **Step 4: Verify Prometheus scrapes the app**

Open `http://localhost:9090/targets` in a browser or run:
`curl -sf http://localhost:9090/api/v1/targets | python3 -c "import sys,json; targets=json.load(sys.stdin)['data']['activeTargets']; [print(t['labels']['job'], t['health']) for t in targets]"`

Expected: `resume-app` target for `app-blue:3000` shows `up`. `app-green:3000` shows `down` (expected — it's not running).

- [ ] **Step 5: Stop the stack**

Run: `docker compose down`

- [ ] **Step 6: Verify deploy script syntax**

Run: `bash -n scripts/deploy.sh && echo "Syntax OK"`
Expected: `Syntax OK`

- [ ] **Step 7: Commit any fixes**

If any adjustments were needed during validation, commit them:

```bash
git add -A
git commit -m "fix: adjustments from local validation of blue-green setup"
```

If no fixes were needed, skip this step.
