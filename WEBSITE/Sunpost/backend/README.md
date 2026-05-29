# Sunpost Backend API

Simple instructions to run the backend API locally for development and quick checks.

Quick start

1. Open a terminal and change into the backend folder:

```bash
cd WEBSITE/Sunpost/backend
```

2. (Optional) activate the project's virtual environment if present:

```bash
source .venv/bin/activate
```

3. Install dependencies (only if needed):

```bash
python3 -m pip install -r requirements.txt
```

4. Configure Firebase credentials and web API key (required for real auth flows):

- Place your service account JSON at `WEBSITE/CREDENTIALS/service-account.json` and/or set the `GOOGLE_APPLICATION_CREDENTIALS` env var to its path.
- In `WEBSITE/Sunpost/backend/.env` (or your shell), set the realtime DB URL and the web API key:

```env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/WEBSITE/CREDENTIALS/service-account.json
FIREBASE_DATABASE_URL=https://<your-project>-default-rtdb.<region>.firebaseio.com
FIREBASE_WEB_API_KEY=AIza...   # your Firebase Web API key (for sign-in)
```

5. Start the backend (defaults to port 8000):

```bash
# development auto-reload (recommended)
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# or the simpler entry
python main.py
```

Quick check

- Open the dashboard in your browser: `http://127.0.0.1:8000/`
- Check diagnostics: `http://127.0.0.1:8000/diagnostics`
- Example curl test:

```bash
curl -sS http://127.0.0.1:8000/diagnostics | jq
```

Useful endpoints

- `GET /` — dashboard
- `GET /diagnostics` — status report
- `GET /test-firestore` — Firestore connectivity test
- `GET /test-realtime` — Realtime Database connectivity test
- `POST /public/signup` — create a new user (public)
- `POST /public/login` — authenticate a user (public)

Notes

- `FIREBASE_WEB_API_KEY` is required for password-based sign-in flows — obtain it from Firebase Console → Project settings → Web API key.
- If you don't provide the web API key but have a valid service account and network access, the backend can attempt to fetch the web API key automatically.
