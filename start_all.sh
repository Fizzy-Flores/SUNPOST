#!/usr/bin/env bash
set -eu
# Lightweight starter for Sunpost frontend + backend for local dev.
# Starts backend (uvicorn) and frontend (serve.py), waits for readiness,
# and opens the site in the default browser when ready.

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/SUNPOST"
BACKEND_DIR="$ROOT_DIR/WEBSITE/Sunpost/backend"
FRONTEND_PORT=${FRONTEND_PORT:-8080}
BACKEND_PORT=${BACKEND_PORT:-8000}
BACKEND_LOG="$ROOT_DIR/.sunpost_backend.log"
FRONTEND_LOG="$ROOT_DIR/.sunpost_frontend.log"

echo "Starting Sunpost (frontend -> http://127.0.0.1:${FRONTEND_PORT}, backend -> http://127.0.0.1:${BACKEND_PORT})"

# Helper: check if port in use
port_in_use() {
  ss -ltn "sport = :$1" | grep -q LISTEN || return 1
}

# Start backend if not running
start_backend_on() {
  local port=$1
  echo "Starting backend on port ${port}... (logs: ${BACKEND_LOG})"
  (cd "$BACKEND_DIR" && \
    if [ -f .venv/bin/activate ]; then
      . .venv/bin/activate && python -m uvicorn main:app --reload --host 0.0.0.0 --port "$port" >>"$BACKEND_LOG" 2>&1 &
    else
      python -m uvicorn main:app --reload --host 0.0.0.0 --port "$port" >>"$BACKEND_LOG" 2>&1 &
    fi)
  sleep 0.6
}

if port_in_use "$BACKEND_PORT"; then
  echo "Port ${BACKEND_PORT} in use — checking whether it is the backend service..."
else
  start_backend_on "$BACKEND_PORT"
fi

# Start frontend if not running
if port_in_use "$FRONTEND_PORT"; then
  echo "Frontend already listening on port ${FRONTEND_PORT}, skipping start."
else
  echo "Starting frontend server... (logs: ${FRONTEND_LOG})"
  (cd "$FRONTEND_DIR" && PORT="$FRONTEND_PORT" python3 serve.py >>"$FRONTEND_LOG" 2>&1 &)
  sleep 0.4
fi

# Wait for services to respond
wait_for_url() {
  local url="$1"; local timeout=${2:-20};
  local start=$(date +%s)
  while true; do
    if curl -sSf "$url" >/dev/null 2>&1; then
      return 0
    fi
    if [ $(( $(date +%s) - start )) -ge "$timeout" ]; then
      return 1
    fi
    sleep 0.5
  done
}

echo "Waiting for frontend to be ready..."
if wait_for_url "http://127.0.0.1:${FRONTEND_PORT}/" 20; then
  echo "Frontend ready"
else
  echo "Frontend did not respond within timeout. See ${FRONTEND_LOG}"
fi

echo "Waiting for backend to be ready..."
backend_ok=false
if wait_for_url "http://127.0.0.1:${BACKEND_PORT}/diagnostics" 4; then
  backend_ok=true
fi

if [ "$backend_ok" = false ]; then
  echo "Service on ${BACKEND_PORT} didn't respond like the API. Trying alternate port 8001."
  ALT_PORT=8001
  if port_in_use "$ALT_PORT"; then
    echo "Alternate port ${ALT_PORT} already in use. Will not overwrite."
  else
    start_backend_on "$ALT_PORT"
  fi
  if wait_for_url "http://127.0.0.1:${ALT_PORT}/diagnostics" 20; then
    echo "Backend started on ${ALT_PORT}"
    BACKEND_PORT=$ALT_PORT
  else
    echo "Backend did not respond within timeout. See ${BACKEND_LOG}"
  fi
else
  echo "Backend ready on ${BACKEND_PORT}"
fi

# Create or update frontend site-config so auth.js uses the correct backend base URL
SITE_CONFIG="$FRONTEND_DIR/site-config.js"
echo "window.SUNPOST_API_BASE = 'http://127.0.0.1:${BACKEND_PORT}';" > "$SITE_CONFIG"
echo "Wrote frontend API config to ${SITE_CONFIG}"

# Open the browser if possible
URL="http://127.0.0.1:${FRONTEND_PORT}/"
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL" >/dev/null 2>&1 || true
elif command -v open >/dev/null 2>&1; then
  open "$URL" >/dev/null 2>&1 || true
else
  echo "Open your browser at: $URL"
fi

echo "Logs: backend=$BACKEND_LOG frontend=$FRONTEND_LOG"

echo "Tailing logs (press Ctrl+C to exit but services will keep running)."

# Tail logs
exec tail -n +1 -f "$BACKEND_LOG" "$FRONTEND_LOG" 2>/dev/null || true
