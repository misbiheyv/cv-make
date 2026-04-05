# Blue-Green Deployment to Hetzner

## Overview

Deploy the Resume Builder as a blue-green setup on a Hetzner VPS with zero-downtime deploys triggered manually from GitHub Actions. The app runs as two alternating Docker containers behind Nginx, with Prometheus and Grafana on the same server.

## Infrastructure

### Server

- **Provider:** Hetzner Cloud
- **Plan:** CPX31 (4 vCPU, 8GB RAM, 160GB SSD, ~$15/month)
- **OS:** Ubuntu 22.04 LTS
- **Software:** Docker Engine, Docker Compose plugin, Certbot, UFW, Fail2ban

### Security (one-time setup)

- UFW firewall: allow 22 (SSH), 80 (HTTP), 443 (HTTPS) only
- Fail2ban for SSH brute-force protection
- Non-root `deploy` user with docker group access (no sudo)
- Dedicated SSH key for GitHub Actions (stored as Actions secret)

### Domain & SSL

- New domain with A record pointing to the Hetzner server IP
- Let's Encrypt certificates via Certbot
- Nginx terminates SSL and proxies to app containers
- Certbot auto-renewal via systemd timer (default on Ubuntu)

### Container Registry

- GitHub Container Registry (GHCR)
- Images tagged with git SHA and `latest`
- CI builds and pushes; the server pulls during deploy

## Blue-Green Architecture

### Container Layout

Two identical app service definitions in `docker-compose.yml`: `app-blue` and `app-green`. No `container_name` on any service — Docker auto-generates names. Only one app container runs at a time; the other is idle (stopped).

```
Internet
  │
  ▼
Nginx (ports 80/443, SSL termination)
  │
  ├── upstream.conf → symlink to upstream-blue.conf OR upstream-green.conf
  │
  ├── app-blue:3000   ← active OR idle
  └── app-green:3000  ← idle OR active

Prometheus ──► scrapes both (only active responds)
Grafana
Nginx-exporter
```

### Nginx Upstream Switching

Three Nginx upstream config files:

- `nginx/upstream-blue.conf` — `upstream app { server app-blue:3000; }`
- `nginx/upstream-green.conf` — `upstream app { server app-green:3000; }`
- `nginx/upstream.conf` — symlink to whichever color is active

The main `nginx.conf` includes `upstream.conf` and uses `proxy_pass http://app`. During deploy, the script updates the symlink and runs `nginx -s reload`, which gracefully starts new workers while old workers finish in-flight connections.

### Nginx Config Changes

The production `nginx.conf` adds:
- SSL termination (certificates from `/etc/letsencrypt/`)
- HTTP-to-HTTPS redirect
- `include /etc/nginx/conf.d/upstream.conf;` instead of hardcoded `proxy_pass`

Rate limiting, stub_status, X-Request-Id, and all existing config remain unchanged.

### Health Check Contract

Before switching traffic, the deploy script polls the new container's health endpoint:

- **Endpoint:** `GET /api/health`
- **Success criteria:** HTTP 200 with `"status": "healthy"` in body
- **Timeout:** 60 seconds (accounts for Chromium cold start in the browser pool)
- **Poll interval:** 2 seconds

If the health check fails within 60 seconds, the deploy aborts. The old container keeps serving traffic, and the new container is stopped.

### Drain Timeout

After Nginx reloads to point at the new container, the script waits 15 seconds before stopping the old container. This allows in-flight requests (PDF generation takes up to 5 seconds) to complete on the old container's Nginx workers.

## Deploy Script

### Location

`scripts/deploy.sh` in the repo, deployed to `/opt/resume/scripts/deploy.sh` on the server.

### Interface

```bash
./scripts/deploy.sh <image-tag>
# e.g., ./scripts/deploy.sh ghcr.io/user/resume:abc1234
```

### Logic

```
1.  Read /opt/resume/active-color → current (e.g., "blue")
    - If file missing (first deploy), default to "blue" as target, skip steps 8-9
2.  Derive next = opposite color (e.g., "green")
3.  Pull the new image: docker compose pull app-{next}
4.  Start the new container: docker compose up -d app-{next}
5.  Poll health check every 2s for up to 60s:
    docker compose exec app-{next} curl -sf http://localhost:3000/api/health
    - On timeout → docker compose stop app-{next}, exit 1
6.  Update symlink: nginx/upstream.conf → upstream-{next}.conf
7.  Reload Nginx: docker compose exec nginx nginx -s reload
8.  Sleep 15s (drain in-flight requests on old container)
9.  Stop old container: docker compose stop app-{current}
10. Write "{next}" to /opt/resume/active-color
11. Log success with timestamp and image tag
```

### Properties

- **Idempotent:** If it fails midway and is re-run, it reads current state and picks up correctly
- **Rollback:** Re-run with the previous image tag
- **First deploy:** Detects missing state file, starts blue, sets state, skips drain/stop

## CI/CD Pipeline

### Existing CI (unchanged)

```
push to main / PR → install → lint, typecheck, test (parallel)
```

### New CD Workflow (`.github/workflows/cd.yml`)

**Trigger:** `workflow_dispatch` with optional `version` input

**Steps:**

1. Checkout code
2. Log in to GHCR
3. Build Docker image
4. Tag with git SHA + `latest` (and `version` input if provided)
5. Push to GHCR
6. SSH into Hetzner server:
   - SCP updated files (compose, nginx configs, scripts, prometheus config) to `/opt/resume/`
   - Run `./scripts/deploy.sh ghcr.io/<user>/resume:<tag>`
7. Report success/failure

**Secrets required:**

- `DEPLOY_SSH_KEY` — private key for the deploy user
- `DEPLOY_HOST` — Hetzner server IP or hostname
- `DEPLOY_USER` — username on the server (e.g., `deploy`)

**Failure modes:**

- Image build fails → workflow fails, nothing deployed
- Health check fails → old container stays active, new container stopped, workflow fails
- Nginx reload fails → script exits, old upstream still active, workflow fails

## Prometheus Configuration

Scrape both blue and green targets. Only the active one responds; Prometheus marks the other as `up=0`.

```yaml
scrape_configs:
  - job_name: 'resume-app'
    metrics_path: '/api/metrics'
    static_configs:
      - targets: ['app-blue:3000', 'app-green:3000']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']
```

No deploy script changes needed for Prometheus. Grafana dashboards filter by `instance` label.

## Server Directory Layout

```
/opt/resume/
├── docker-compose.yml
├── .env                        # production values, never committed
├── nginx/
│   ├── nginx.conf              # main config with SSL termination
│   ├── upstream-blue.conf
│   ├── upstream-green.conf
│   └── upstream.conf           # symlink → upstream-{active}.conf
├── prometheus/
│   └── prometheus.yml
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/
│   │   └── dashboards/
│   └── dashboards/
├── scripts/
│   └── deploy.sh
└── active-color                # plain text: "blue" or "green"
```

- `.env` lives only on the server with production values (rate limits, pool sizes, Grafana password)
- SSL certs at `/etc/letsencrypt/`, mounted into Nginx container
- Persistent Docker volumes (prometheus_data, grafana_data) survive deploys — only individual containers are stopped/started, never `docker compose down`

## Files Changed in Repo

| File | Change |
|------|--------|
| `docker-compose.yml` | Split `app` into `app-blue`/`app-green`, remove all `container_name`, add SSL cert volume to Nginx, add upstream.conf volume |
| `nginx/nginx.conf` | Add SSL termination, HTTP→HTTPS redirect, `include upstream.conf`, use `proxy_pass http://app` |
| `nginx/upstream-blue.conf` | New — `upstream app { server app-blue:3000; }` |
| `nginx/upstream-green.conf` | New — `upstream app { server app-green:3000; }` |
| `scripts/deploy.sh` | New — blue-green deploy orchestration script |
| `.github/workflows/cd.yml` | New — CD workflow with manual trigger |
| `prometheus/prometheus.yml` | Add `app-green:3000` target |
| `.env.example` | Add deployment-related env vars documentation |

## Horizontal Scaling (Future)

When the time comes to scale beyond a single server:

1. Spin up additional Hetzner VPS instances running the same Compose stack
2. Place them behind a Hetzner Load Balancer (~$6/month)
3. Each instance independently runs blue-green deploys
4. Prometheus federation or a central Prometheus scrapes all instances
5. The CD workflow loops over server IPs for sequential rolling deploys
