#!/bin/bash
set -euo pipefail
EMULATOR_LOG=/tmp/fbemu.log
FORCE_LOCAL_OTP=true firebase emulators:start --only functions,auth > "$EMULATOR_LOG" 2>&1 &
EMULATOR_PID=$!
for i in $(seq 1 60); do
  if curl -sS http://localhost:5001/ >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "Emulators started (pid=$EMULATOR_PID)"

TOKEN_JSON=$(curl -s -X POST 'http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=any' -H 'Content-Type: application/json' -d '{"email":"test+emu@example.com","password":"password","returnSecureToken":true}')
IDTOKEN=$(printf '%s' "$TOKEN_JSON" | python3 -c 'import json,sys; obj=json.load(sys.stdin); print(obj.get("idToken",""))')
LOCALID=$(printf '%s' "$TOKEN_JSON" | python3 -c 'import json,sys; obj=json.load(sys.stdin); print(obj.get("localId",""))')
echo "Created test user: uid=$LOCALID idToken-present=$( [ -n "$IDTOKEN" ] && echo yes || echo no )"

echo "--- /diagnostics ---"
DIAG=$(curl -sS "http://localhost:5001/finals-project-database/us-central1/api/diagnostics")
printf '%s' "$DIAG" | python3 -c 'import json,sys; print(json.dumps(json.load(sys.stdin), indent=2))'

echo "--- /public/request-otp ---"
REQ=$(curl -sS -X POST "http://localhost:5001/finals-project-database/us-central1/api/public/request-otp" -H 'Content-Type: application/json' -d "{\"idToken\":\"$IDTOKEN\"}")
printf '%s' "$REQ" | python3 -c 'import json,sys; print(json.dumps(json.load(sys.stdin), indent=2))'

CODE=$(printf '%s' "$REQ" | python3 -c 'import json,sys; obj=json.load(sys.stdin); print(obj.get("dev_code",""))')
echo "OTP code from local test helper: $CODE"
if [ -z "$CODE" ]; then
  echo "ERROR: dev_code missing from request-otp response" >&2
  exit 1
fi

echo "--- /public/verify-otp ---"
VER=$(curl -sS -X POST "http://localhost:5001/finals-project-database/us-central1/api/public/verify-otp" -H 'Content-Type: application/json' -d "{\"idToken\":\"$IDTOKEN\",\"otp\":\"$CODE\"}")
printf '%s' "$VER" | python3 -c 'import json,sys; print(json.dumps(json.load(sys.stdin), indent=2))'

kill $EMULATOR_PID || true
sleep 1
