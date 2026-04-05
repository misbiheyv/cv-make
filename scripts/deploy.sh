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
