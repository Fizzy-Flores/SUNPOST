#!/bin/bash
# Kill processes running on ports used by Sunpost
fuser -k 8000/tcp || true
