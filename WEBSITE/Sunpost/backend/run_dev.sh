#!/bin/bash
# Run Sunpost backend with auto-reload.
# Listens on all interfaces but requires ADMIN_API_KEY on every request.
source .venv/bin/activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
