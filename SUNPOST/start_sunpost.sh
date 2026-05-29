#!/usr/bin/env bash
cd "$(dirname "$0")" || exit 1
PORT=${PORT:-8080}
python3 serve.py "$PORT"
