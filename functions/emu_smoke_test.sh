#!/bin/bash
set -euo pipefail

# Start the emulator suite for functions and auth, with local OTP storage enabled.
EMULATOR_LOG=/tmp/fb_emulator.log
FORCE_LOCAL_OTP=true firebase emulators:start --only functions,auth > "$EMULATOR_LOG" 2>&1 &
EMULATOR_PID=$!
for i in $(seq 1 60); do
  if curl -sS http://localhost:5001/ >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "Emulators started (pid=$EMULATOR_PID)"

echo "--- diagnostics ---"
curl -sS http://localhost:5001/finals-project-database/us-central1/api/diagnostics | python3 -c 'import json,sys; print(json.dumps(json.load(sys.stdin), indent=2))'

echo "--- create auth user ---"
TOKEN_JSON=$(curl -sS -X POST 'http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=any' -H 'Content-Type: application/json' -d '{"email":"test+emu@example.com","password":"password","returnSecureToken":true}')
printf '%s\n' "$TOKEN_JSON" | python3 -c 'import json,sys; print(json.dumps(json.load(sys.stdin), indent=2))'
IDTOKEN=$(printf '%s' "$TOKEN_JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("idToken",""))')
echo "idToken present: ${IDTOKEN:+yes}"

echo "--- request otp ---"
REQ=$(curl -sS -X POST 'http://localhost:5001/finals-project-database/us-central1/api/public/request-otp' -H 'Content-Type: application/json' -d "{\"idToken\":\"$IDTOKEN\"}")
printf '%s\n' "$REQ" | python3 -c 'import json,sys; print(json.dumps(json.load(sys.stdin), indent=2))'
CODE=$(printf '%s' "$REQ" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("dev_code",""))')
echo "otp code: $CODE"

echo "--- verify otp ---"
VER=$(curl -sS -X POST 'http://localhost:5001/finals-project-database/us-central1/api/public/verify-otp' -H 'Content-Type: application/json' -d "{\"idToken\":\"$IDTOKEN\",\"otp\":\"$CODE\"}")
printf '%s\n' "$VER" | python3 -c 'import json,sys; print(json.dumps(json.load(sys.stdin), indent=2))'
