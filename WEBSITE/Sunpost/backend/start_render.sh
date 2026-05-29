#!/usr/bin/env bash
set -euo pipefail
echo "Starting Sunpost backend startup diagnostics..."
export PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION=python
echo "Set PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION=$PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"
echo "User: $(whoami)"
echo "PWD: $(pwd)"
echo "Python: $(python --version 2>&1)"
echo "Uvicorn: $(python -c 'import uvicorn, sys; print(getattr(uvicorn, "__version__", "uvicorn not importable"))' 2>/dev/null || true)"
echo "Installed packages (top 30):"
pip freeze | head -n 30 || true
echo "-- Environment variables relevant to startup --"
echo "PORT=${PORT:-<not set>}"
echo "PYTHON_VERSION=${PYTHON_VERSION:-<not set>}"
echo "FIREBASE_CRED_PATH=${GOOGLE_APPLICATION_CREDENTIALS:-<not set>}"
echo "FIREBASE_DATABASE_URL=${FIREBASE_DATABASE_URL:-<not set>}"
echo "FIREBASE_WEB_API_KEY=${FIREBASE_WEB_API_KEY:-<not set>}"
echo "Listing backend folder contents:"
ls -la
echo "Checking service account file path existence:"
if [ -n "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]; then
  echo "GOOGLE_APPLICATION_CREDENTIALS is set to: $GOOGLE_APPLICATION_CREDENTIALS"
  if [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo "Service account file exists and is readable"
  else
    echo "Service account file does NOT exist at that path"
  fi
else
  echo "GOOGLE_APPLICATION_CREDENTIALS not set; checking default CREDENTIALS/service-account.json"
  if [ -f "../../CREDENTIALS/service-account.json" ]; then
    echo "Found default service account at ../../CREDENTIALS/service-account.json"
  else
    echo "Default service account not found"
  fi
fi
echo "----- Starting Uvicorn -----"
exec python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info
