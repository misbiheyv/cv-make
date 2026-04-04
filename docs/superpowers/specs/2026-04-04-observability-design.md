# Observability Design Spec

## Overview

Add comprehensive observability to the resume builder: structured logging, application metrics, and a self-contained monitoring stack (Prometheus + Grafana) in Docker Compose. Designed for a single instance behind Nginx today, ready for horizontal scaling later.

## Goals

- **Production debugging:** Structured JSON logs with request ID correlation across Nginx and app layers
- **Performance monitoring:** Time-series metrics for PDF generation, browser pool health, request latency
- **Usage analytics:** Request volumes, error rates, status code distribution via Grafana dashboards
- **System visibility:** Node.js runtime metrics (heap, event loop, GC) and Nginx connection stats

## Dependencies

- `prom-client` — Prometheus metrics for Node.js
- `pino` — Fast JSON structured logger
- `nginx-prometheus-exporter` — Docker image, scrapes Nginx stub_status
- `prometheus` — Docker image, scrapes and stores metrics
- `grafana` — Docker image, dashboards and visualization

No external SaaS services. Everything runs within the Docker Compose stack.

---

## 1. Structured Logging

### New file: `src/lib/logger.ts`

Create a pino logger instance with base config:
- Fields: `service: "resume-builder"`, `environment` (from `NODE_ENV`)
- Log level controlled by `LOG_LEVEL` env var (default: `info` in production, `debug` in development)
- Child loggers created per component: `logger.child({ component: 'browserPool' })`, `logger.child({ requestId, component: 'pdf' })`

### Log levels

| Level | Usage |
|-------|-------|
| `error` | Failures: PDF generation errors, pool crashes, unhandled exceptions |
| `warn` | Degraded states: pool exhaustion, slow generation (>3s), browser disconnections |
| `info` | Lifecycle events: request received, PDF generated, browser created/destroyed |
| `debug` | Detailed diagnostics: validation details, pool state snapshots (disabled in production) |

### Request ID correlation

- Nginx generates `$request_id` and passes it as `X-Request-Id` header
- App reads this header and threads it through all logs for that request
- Enables tracing a single request across Nginx access logs and app logs

### Changes to existing code

- `src/lib/browserPool.ts` — Replace all `console.log/warn/error` with pino child logger
- `src/app/api/pdf/route.tsx` — Replace all `console.*` with pino child logger, include `requestId`
- `src/app/api/health/route.ts` — Replace `console.error` with pino logger

---

## 2. Application Metrics

### New file: `src/lib/metrics.ts`

All Prometheus metrics defined and exported from a single module.

### Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `http_requests_total` | Counter | `method`, `route`, `status` | Total requests by endpoint and status code |
| `http_request_duration_seconds` | Histogram | `method`, `route`, `status` | Request latency distribution |
| `pdf_generation_duration_seconds` | Histogram | `status` | PDF generation time |
| `pdf_generation_total` | Counter | `status` | PDF successes, failures, timeouts |
| `browser_pool_size` | Gauge | `state` (`available`, `in_use`) | Current pool composition |
| `browser_pool_queue_depth` | Gauge | — | Requests waiting for a browser |
| `browser_pool_operations_total` | Counter | `operation` (`acquire`, `release`, `create`, `destroy`) | Pool lifecycle events |
| `browser_pool_acquire_duration_seconds` | Histogram | — | Wait time to acquire a browser |

Default Node.js metrics (event loop lag, heap usage, GC pauses, active handles) collected automatically via `prom-client`'s `collectDefaultMetrics()`.

### New file: `src/app/api/metrics/route.ts`

Exposes `register.metrics()` in Prometheus text format. Returns `Content-Type: text/plain; version=0.0.4`.

### Integration points

- **PDF route:** Wrap generation in histogram timer. Increment `pdf_generation_total` on success/failure/timeout. Record `http_request_duration_seconds`.
- **Browser pool:** Update `browser_pool_size` gauge on acquire/release. Track `browser_pool_queue_depth`. Record `browser_pool_acquire_duration_seconds`. Increment `browser_pool_operations_total` on lifecycle events.
- **HTTP-level:** Record `http_requests_total` and `http_request_duration_seconds` inline in each route handler (2 routes — middleware not necessary).

---

## 3. Infrastructure — Docker Compose

### New services

**Prometheus:**
- Image: `prom/prometheus`
- Config: `prometheus/prometheus.yml`
- Scrapes app `/metrics` endpoint every 15s
- Scrapes `nginx-exporter` every 15s
- Data persisted to `prometheus_data` volume

**Grafana:**
- Image: `grafana/grafana`
- Port: `3001` (avoids conflict with Next.js on 3000)
- Auto-provisioned datasource pointing to Prometheus
- Pre-built dashboards loaded from `grafana/dashboards/` on startup
- Data persisted to `grafana_data` volume

**Nginx Prometheus Exporter:**
- Image: `nginx/nginx-prometheus-exporter`
- Reads Nginx `stub_status` endpoint
- Exposes Nginx metrics: active connections, accepts, requests, reading/writing/waiting

### New files

```
prometheus/
  prometheus.yml          # Scrape config for app and nginx-exporter targets
grafana/
  provisioning/
    datasources/
      datasource.yml      # Prometheus datasource auto-config
    dashboards/
      dashboard.yml       # Dashboard provisioning config
  dashboards/
    overview.json         # Pre-built dashboard definition
```

### Grafana dashboard panels

- **Request overview:** RPS, error rate (4xx/5xx), latency percentiles (p50/p90/p95/p99) over time
- **PDF pipeline:** Generation duration histogram, success/failure/timeout rates, generation time trends
- **Browser pool:** Pool size over time, utilization %, queue depth, acquire wait time
- **System:** Node.js heap usage, event loop lag, GC pause duration
- **Nginx:** Active connections, request rate, connection states (reading/writing/waiting)

---

## 4. Nginx Changes

### Stub status endpoint

Add to `nginx.conf`:
```nginx
location /nginx_status {
    stub_status;
    allow 172.0.0.0/8;
    deny all;
}
```

Restricted to Docker network only. Required by `nginx-prometheus-exporter`.

### Request ID propagation

Add to proxy config:
```nginx
proxy_set_header X-Request-Id $request_id;
```

Generates a unique ID per request, passed to the app for log correlation.

No changes to existing rate limiting, proxy timeouts, or other Nginx behavior.

---

## 5. Changes to Existing Files

| File | Change |
|------|--------|
| `src/lib/browserPool.ts` | Replace `console.*` with pino logger. Add gauge updates on acquire/release, histogram for acquire wait, counter for operations |
| `src/app/api/pdf/route.tsx` | Replace `console.*` with pino logger. Wrap generation in histogram timer, increment counters |
| `src/app/api/health/route.ts` | Replace `console.*` with pino logger |
| `nginx/nginx.conf` | Add `stub_status` location, add `X-Request-Id` proxy header |
| `docker-compose.yml` | Add Prometheus, Grafana, nginx-exporter services and volumes |

### New files

| File | Purpose |
|------|---------|
| `src/lib/metrics.ts` | All Prometheus metric definitions |
| `src/lib/logger.ts` | Pino logger setup and child logger factory |
| `src/app/api/metrics/route.ts` | `/metrics` endpoint for Prometheus scraping |
| `prometheus/prometheus.yml` | Prometheus scrape configuration |
| `grafana/provisioning/datasources/datasource.yml` | Auto-provision Prometheus datasource |
| `grafana/provisioning/dashboards/dashboard.yml` | Dashboard provisioning config |
| `grafana/dashboards/overview.json` | Pre-built Grafana dashboard |

### No changes to

- Frontend components, Zustand store, templates, styles, or any client-side code
- Test files (new tests will be added for metrics and logger modules)
- Existing API behavior or response formats

---

## 6. Scaling Considerations

This design supports horizontal scaling without changes:
- Each app instance exposes its own `/metrics` endpoint
- Prometheus config adds new targets (or uses service discovery)
- Grafana dashboards aggregate across instances using `instance` label
- Structured logs can be aggregated with any log collector (Loki, Fluentd, etc.)
- Request IDs originate in Nginx, which sits in front of all instances
