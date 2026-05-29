#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/Sunpost/backend"

cd "$BACKEND"

if [[ -f .venv/bin/activate ]]; then
  # shellcheck source=/dev/null
  source .venv/bin/activate
elif [[ -f venv/bin/activate ]]; then
  # shellcheck source=/dev/null
  source venv/bin/activate
else
  echo "Creating virtual environment..."
  python3 -m venv .venv
  # shellcheck source=/dev/null
  source .venv/bin/activate
  pip install -r requirements.txt
fi

if [[ ! -f .env ]]; then
  echo "Missing .env — copy .env.example to .env and set ADMIN_API_KEY."
  exit 1
fi

CREDS="${GOOGLE_APPLICATION_CREDENTIALS:-}"
if [[ -z "$CREDS" ]]; then
  CREDS="$(grep -E '^GOOGLE_APPLICATION_CREDENTIALS=' .env | cut -d= -f2- || true)"
fi
if [[ -n "$CREDS" && ! -f "$CREDS" ]]; then
  echo "Warning: service account not found at: $CREDS"
fi

echo "Starting Sunpost API on http://0.0.0.0:8000"
exec python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
