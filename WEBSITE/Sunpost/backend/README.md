# Sunpost Backend API

## Quick setup

```bash
cd WEBSITE/Sunpost/backend
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
```

## Config

Put `service-account.json` in `WEBSITE/CREDENTIALS/service-account.json` or set:

```env
GOOGLE_APPLICATION_CREDENTIALS=/home/xian-flores/new-project/WEBSITE/CREDENTIALS/service-account.json
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
```

## Run

```bash
python main.py
# or
./run_dev.sh
```

## What changed

- Renamed backend branding to **Sunpost**
- Added Firestore support
- Added Realtime Database support
- Added styled dashboard at `/`
- Added `/diagnostics`, `/test-firestore`, and `/test-realtime`
- Improved Firebase signup error messages

## Useful endpoints

- `GET /` — dashboard
- `GET /diagnostics` — Firebase + database status
- `GET /test-firestore` — test Firestore
- `GET /test-realtime` — test Realtime Database
- `POST /signup` — register user
