#!/bin/bash
# Run Sunpost backend with auto-reload
# Accessible via Tailscale network at 100.75.71.126:8000
source .venv/bin/activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
