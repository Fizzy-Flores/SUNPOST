# main.py for Sunpost backend

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import re
import json
import time
import secrets
import hmac
import firebase_admin
from firebase_admin import credentials, auth, firestore, db
from dotenv import load_dotenv
from datetime import datetime
import urllib.request
import urllib.error

# Email sending (Gmail SMTP / OAuth2)
import smtplib
import base64
from email.mime.text import MIMEText

try:
    from google.oauth2.credentials import Credentials as GoogleOAuth2Credentials
    from google.auth.transport.requests import Request as GoogleAuthRequest
except ImportError:
    GoogleOAuth2Credentials = None
    GoogleAuthRequest = None

load_dotenv()

FIREBASE_CRED_PATH = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if not FIREBASE_CRED_PATH:
    # Default to service-account.json in CREDENTIALS if not set
    FIREBASE_CRED_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../CREDENTIALS/service-account.json'))

firebase_enabled = False
firebase_error = None
firestore_enabled = False
firestore_error = None
realtime_enabled = False
realtime_error = None
REALTIME_DB_URL = None


try:
    if os.path.exists(FIREBASE_CRED_PATH):
        cred = credentials.Certificate(FIREBASE_CRED_PATH)

        # Determine Realtime Database URL from explicit env only
        db_url = os.getenv("FIREBASE_DATABASE_URL", "").strip() or None
        if not db_url:
            realtime_error = (
                "Realtime Database URL not configured. "
                "Set FIREBASE_DATABASE_URL in WEBSITE/Sunpost/backend/.env and restart."
            )

        # Check if firebase_admin is already initialized
        try:
            firebase_admin.get_app()
        except ValueError:
            if db_url:
                firebase_admin.initialize_app(cred, {"databaseURL": db_url})
            else:
                firebase_admin.initialize_app(cred)

        firebase_enabled = True
        print(f"Firebase initialized successfully with credentials from: {FIREBASE_CRED_PATH}")

        # Initialize Firestore
        try:
            firestore.client()
            firestore_enabled = True
            print("Firestore initialized successfully")
        except Exception as fs_error:
            firestore_error = str(fs_error)
            print(f"Firestore initialization error: {fs_error}")

        # Initialize Realtime Database
        try:
            if db_url:
                db.reference("/").get()
                realtime_enabled = True
                REALTIME_DB_URL = db_url
                print(f"Realtime Database initialized successfully at: {db_url}")
            else:
                realtime_error = "Realtime Database URL not configured"
                print(realtime_error)
        except Exception as rt_error:
            realtime_error = str(rt_error)
            print(f"Realtime Database initialization error: {rt_error}")
    else:
        firebase_error = f"Service account file not found at: {FIREBASE_CRED_PATH}"
        print(firebase_error)
except Exception as e:
    firebase_error = str(e)
    print(f"Firebase initialization error: {e}")
    firebase_enabled = False

# HTML Dashboard for the API
def get_dashboard_html():
    firebase_status = "🟢 Connected" if firebase_enabled else "🔴 Disconnected"
    firestore_status = "🟢 Connected" if firestore_enabled else "🔴 Disconnected"
    realtime_status = "🟢 Connected" if realtime_enabled else "🔴 Disconnected"
    firebase_class = "status-active" if firebase_enabled else "status-inactive"
    firestore_class = "status-active" if firestore_enabled else "status-inactive"
    realtime_class = "status-active" if realtime_enabled else "status-inactive"

    realtime_nav = (
        '<a class="nav-link" href="/test-realtime">Realtime</a>'
        if realtime_enabled else
        '<span class="nav-link disabled">Realtime</span>'
    )

    realtime_action = (
        '<a class="secondary-btn" href="/test-realtime">Test Realtime</a>'
        if realtime_enabled else
        '<span class="secondary-btn disabled">Realtime unavailable</span>'
    )

    realtime_endpoint = (
        f"""
        <div class="endpoint-card">
            <div class="endpoint-meta">
                <span class="endpoint-method">GET</span>
                <span class="endpoint-path">/test-realtime</span>
            </div>
            <p class="endpoint-desc">Realtime Database is not configured or unavailable.</p>
            <p class="endpoint-details">{realtime_error or 'Add FIREBASE_DATABASE_URL to Sunpost/backend/.env and enable Realtime Database in Firebase Console.'}</p>
        </div>
        """
        if not realtime_enabled else
        """
        <div class="endpoint-card">
            <div class="endpoint-meta">
                <span class="endpoint-method">GET</span>
                <span class="endpoint-path">/test-realtime</span>
            </div>
            <p class="endpoint-desc">Writes and reads test data from Realtime Database to verify connectivity.</p>
        </div>
        """
    )

    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Sunpost API</title>
        <style>
            :root {{
                color-scheme: dark;
                --background: #3c1f13;
                --surface: rgba(27, 12, 8, 0.94);
                --surface-soft: rgba(255, 233, 188, 0.12);
                --text: #f8e4c1;
                --muted: #f2d9b1;
                --accent: #f7c58a;
                --border: rgba(255, 255, 255, 0.12);
            }}

            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}

            html,
            body {{
                min-height: 100%;
            }}

            body {{
                font-family: 'Poppins', sans-serif;
                background: radial-gradient(circle at top left, rgba(255, 223, 139, 0.22), transparent 24%),
                    radial-gradient(circle at bottom right, rgba(255, 182, 110, 0.18), transparent 18%),
                    linear-gradient(180deg, #8c4f2e 0%, #3e1e11 100%);
                color: var(--text);
                padding: 2rem;
            }}

            .page {{
                min-height: 100vh;
                display: grid;
                place-items: center;
            }}

            .dashboard {{
                width: min(1200px, 100%);
                display: grid;
                gap: 2rem;
            }}

            .animated-background {{
                position: fixed;
                inset: 0;
                z-index: -1;
                overflow: hidden;
                pointer-events: none;
            }}

            .glow {{
                position: absolute;
                width: 360px;
                height: 360px;
                border-radius: 50%;
                filter: blur(90px);
                opacity: 0.55;
                animation: drift 12s ease-in-out infinite;
            }}

            .glow-1 {{
                background: rgba(255, 217, 156, 0.32);
                top: 8%;
                left: 14%;
            }}

            .glow-2 {{
                background: rgba(255, 192, 124, 0.2);
                right: 6%;
                bottom: 8%;
                width: 420px;
                height: 420px;
            }}

            @keyframes drift {{
                0%, 100% {{ transform: translate(0, 0); }}
                50% {{ transform: translate(12px, -18px); }}
            }}

            .site-header {{
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
            }}

            .brand {{
                display: flex;
                align-items: center;
                gap: 1rem;
            }}

            .brand-mark {{
                width: 64px;
                height: 64px;
                border-radius: 24px;
                background: linear-gradient(135deg, rgba(255, 241, 194, 0.9), rgba(255, 172, 99, 0.92));
                box-shadow: 0 24px 55px rgba(0, 0, 0, 0.12);
            }}

            .brand-text .eyebrow {{
                text-transform: uppercase;
                letter-spacing: 0.22em;
                color: var(--muted);
                font-size: 0.8rem;
                margin-bottom: 0.4rem;
            }}

            .brand-text h1 {{
                font-size: clamp(2rem, 2.5vw, 2.6rem);
                line-height: 1.05;
                color: var(--text);
            }}

            .site-nav {{
                display: flex;
                flex-wrap: wrap;
                gap: 1rem;
            }}

            .nav-link, .nav-link.disabled {{
                padding: 0.85rem 1rem;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.08);
                color: #fff;
                text-decoration: none;
                transition: transform 0.2s ease, background-color 0.2s ease;
                display: inline-flex;
                align-items: center;
            }}

            .nav-link.disabled, .secondary-btn.disabled {{
                opacity: 0.65;
                pointer-events: none;
                cursor: default;
            }}

            .nav-link:hover,
            .nav-link.active {{
                background: rgba(255, 255, 255, 0.14);
                transform: translateY(-1px);
            }}

            .hero-panel {{
                display: grid;
                grid-template-columns: 1.4fr 0.9fr;
                gap: 2rem;
                align-items: center;
            }}

            .hero-copy {{
                max-width: 40rem;
            }}

            .hero-copy .eyebrow {{
                margin-bottom: 1rem;
            }}

            .hero-copy h2 {{
                font-size: clamp(2.8rem, 4vw, 4.2rem);
                margin-bottom: 1.2rem;
            }}

            .hero-copy p {{
                color: rgba(248, 228, 193, 0.95);
                font-size: 1.05rem;
                line-height: 1.75;
                margin-bottom: 1.8rem;
                max-width: 48ch;
            }}

            .hero-actions {{
                display: flex;
                flex-wrap: wrap;
                gap: 1rem;
            }}

            .primary-btn,
            .secondary-btn {{
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 1rem 1.5rem;
                border-radius: 999px;
                font-weight: 700;
                text-decoration: none;
                transition: transform 0.2s ease, opacity 0.2s ease;
            }}

            .primary-btn {{
                background: linear-gradient(135deg, #f7c58a, #d9773f);
                color: #1f0c04;
            }}

            .secondary-btn {{
                background: rgba(255, 255, 255, 0.08);
                color: #fff;
            }}

            .hero-panel-right {{
                position: relative;
                overflow: hidden;
                padding: 2rem;
                border-radius: 32px;
                background: linear-gradient(180deg, rgba(255, 217, 156, 0.12), rgba(128, 58, 20, 0.7));
                border: 1px solid var(--border);
                min-height: 360px;
                display: grid;
                place-content: center;
            }}

            .hero-panel-right::before {{
                content: '';
                position: absolute;
                inset: 0;
                background: radial-gradient(circle at 20% 25%, rgba(255, 255, 255, 0.16), transparent 16%),
                    radial-gradient(circle at 80% 15%, rgba(255, 224, 166, 0.18), transparent 15%),
                    radial-gradient(circle at 45% 80%, rgba(255, 255, 255, 0.08), transparent 12%);
                pointer-events: none;
            }}

            .hero-panel-right .panel-copy {{
                position: relative;
                z-index: 1;
                color: rgba(248, 228, 193, 0.95);
            }}

            .hero-panel-right h3 {{
                margin-bottom: 1rem;
                font-size: 1.75rem;
            }}

            .hero-panel-right p {{
                color: rgba(248, 228, 193, 0.92);
                line-height: 1.75;
            }}

            .status-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                gap: 1.5rem;
            }}

            .status-card {{
                background: rgba(27, 12, 8, 0.96);
                padding: 1.8rem;
                border-radius: 24px;
                border: 1px solid rgba(255, 255, 255, 0.08);
                box-shadow: 0 28px 70px rgba(0, 0, 0, 0.18);
            }}

            .status-card h3 {{
                margin-bottom: 1rem;
                font-size: 1.3rem;
                color: #f8e4c1;
            }}

            .status-card .status-description {{
                color: rgba(248, 228, 193, 0.86);
            }}

            .endpoint-cards {{
                display: grid;
                gap: 1.2rem;
            }}

            .endpoint-card {{
                background: rgba(255, 233, 188, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px;
                padding: 1.6rem;
                display: grid;
                gap: 0.8rem;
            }}

            .endpoint-meta {{
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 0.8rem;
            }}

            .endpoint-desc {{
                color: rgba(248, 228, 193, 0.9);
                line-height: 1.7;
            }}

            .endpoint-details {{
                color: rgba(248, 228, 193, 0.78);
                font-size: 0.95rem;
            }}

            .footer {{
                border-top: 1px solid rgba(255, 255, 255, 0.08);
                padding-top: 1.2rem;
                color: #f2d9b1;
                text-align: center;
                font-size: 0.95rem;
            }}

            @media (max-width: 960px) {{
                .hero-panel {{
                    grid-template-columns: 1fr;
                }}
            }}

            @media (max-width: 700px) {{
                .site-header {{
                    flex-direction: column;
                    align-items: stretch;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="animated-background" aria-hidden="true">
            <div class="glow glow-1"></div>
            <div class="glow glow-2"></div>
        </div>
        <div class="page">
            <div class="dashboard">
                <header class="site-header">
                    <div class="brand">
                        <div class="brand-mark"></div>
                        <div class="brand-text">
                            <p class="eyebrow">SunPost API</p>
                            <h1>Backend dashboard for your API</h1>
                        </div>
                    </div>
                    <nav class="site-nav">
                        <a class="nav-link active" href="/">Status</a>
                        <a class="nav-link" href="/diagnostics">Diagnostics</a>
                        <a class="nav-link" href="/test-firestore">Firestore</a>
                        {realtime_nav}
                    </nav>
                </header>

                <section class="hero-panel">
                    <div class="hero-copy">
                        <p class="eyebrow">Backend status view</p>
                        <h2>Monitor Firebase health and API access from a polished Sunpost interface.</h2>
                        <p>Check authentication, Firestore, and realtime database availability with one beautiful dashboard that matches the Sunpost frontend style.</p>
                        <div class="hero-actions">
                            <a class="primary-btn" href="/diagnostics">Run diagnostics</a>
                            <a class="secondary-btn" href="/test-firestore">Test Firestore</a>
                            {realtime_action}
                        </div>
                    </div>
                    <div class="hero-panel-right">
                        <div class="panel-copy">
                            <h3>API status in one place</h3>
                            <p>Sunpost backend blends Firebase connectivity and diagnostics with the same warm, creative palette you use on the frontend.</p>
                        </div>
                    </div>
                </section>

                <section class="status-grid">
                    <div class="status-card">
                        <h3>Firebase Auth</h3>
                        <div class="status {firebase_class}">{firebase_status}</div>
                        <p class="status-description">Authentication service ready for sign-up and login flows.</p>
                    </div>
                    <div class="status-card">
                        <h3>Firestore</h3>
                        <div class="status {firestore_class}">{firestore_status}</div>
                        <p class="status-description">Document database connectivity for user, post, and metadata storage.</p>
                    </div>
                    <div class="status-card">
                        <h3>Realtime Database</h3>
                        <div class="status {realtime_class}">{realtime_status}</div>
                        <p class="status-description">Realtime sync service for live updates and diagnostics.</p>
                    </div>
                </section>

                <section class="endpoint-cards">
                    <div class="endpoint-card">
                        <div class="endpoint-meta">
                            <span class="endpoint-method">GET</span>
                            <span class="endpoint-path">/</span>
                        </div>
                        <p class="endpoint-desc">Dashboard overview for the Sunpost backend API.</p>
                    </div>
                    <div class="endpoint-card">
                        <div class="endpoint-meta">
                            <span class="endpoint-method">GET</span>
                            <span class="endpoint-path">/diagnostics</span>
                        </div>
                        <p class="endpoint-desc">Returns Firebase and database diagnostics for debugging configuration and health.</p>
                        <p class="endpoint-details">Open this route to inspect errors and service status.</p>
                    </div>
                    <div class="endpoint-card">
                        <div class="endpoint-meta">
                            <span class="endpoint-method">GET</span>
                            <span class="endpoint-path">/test-firestore</span>
                        </div>
                        <p class="endpoint-desc">Writes and reads test data from Firestore to verify the connection.</p>
                    </div>
                    {realtime_endpoint}
                    <div class="endpoint-card">
                        <div class="endpoint-meta">
                            <span class="endpoint-method">POST</span>
                            <span class="endpoint-path">/signup</span>
                        </div>
                        <p class="endpoint-desc">Register a new Firebase auth user through the backend.</p>
                        <p class="endpoint-details">JSON body: {{"username":"string","email":"string","password":"string"}}</p>
                    </div>
                </section>

                <div class="footer">
                    <p>🎨 Sunpost Backend v1.0 | Powered by FastAPI + Firebase + Firestore</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Gmail OTP verification (server-side)
# -----------------------------
# In-memory OTP state (fast; clears on server restart)
OTP_TTL_SECONDS = int(os.getenv("OTP_TTL_SECONDS", "300"))  # default 5 minutes
OTP_RATE_LIMIT_SECONDS = int(os.getenv("OTP_RATE_LIMIT_SECONDS", "60"))  # default 1 minute

# Structure:
# otp_store[uid] = { "code_hash": str, "expires_at": float, "email": str }
otp_store = {}
# last_request_store[uid] = timestamp
last_request_store = {}

# Simple “verified” state so frontend can proceed.
# verified_store[uid] = expires_at
verified_store = {}


def _generate_otp_code(n_digits: int = 6) -> str:
    # zero-padded
    return f"{secrets.randbelow(10 ** n_digits):0{n_digits}d}"


def _hash_otp(code: str) -> str:
    secret = os.getenv("OTP_HASH_SECRET", "dev-otp-hash-secret")
    # HMAC for stable hashing
    return hmac.new(secret.encode("utf-8"), code.encode("utf-8"), digestmod="sha256").hexdigest()


def _build_xoauth2_string(user: str, access_token: str) -> str:
    auth_string = f"user={user}\x01auth=Bearer {access_token}\x01\x01"
    return base64.b64encode(auth_string.encode("utf-8")).decode("ascii")


def _refresh_gmail_access_token():
    client_id = os.getenv("GMAIL_CLIENT_ID", "").strip()
    client_secret = os.getenv("GMAIL_CLIENT_SECRET", "").strip()
    refresh_token = os.getenv("GMAIL_REFRESH_TOKEN", "").strip()

    if not client_id or not client_secret or not refresh_token:
        return None
    if GoogleOAuth2Credentials is None or GoogleAuthRequest is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Gmail OAuth2 is not available because google-auth is not installed. "
                "Install the required library or use SMTP app-password credentials."
            ),
        )

    creds = GoogleOAuth2Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret,
    )
    creds.refresh(GoogleAuthRequest())
    return creds.token


def _get_smtp_transport():
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587").strip() or "587")
    smtp_user = os.getenv("GMAIL_ADDRESS", "").strip() or os.getenv("SMTP_USER", "").strip()
    smtp_pass = os.getenv("SMTP_PASS", "").strip()
    gmail_sender = os.getenv("GMAIL_SENDER", "").strip()

    use_oauth2 = bool(os.getenv("GMAIL_CLIENT_ID", "").strip() and
                      os.getenv("GMAIL_CLIENT_SECRET", "").strip() and
                      os.getenv("GMAIL_REFRESH_TOKEN", "").strip())

    if use_oauth2:
        if not smtp_user:
            raise HTTPException(
                status_code=503,
                detail=(
                    "GMAIL_ADDRESS or SMTP_USER must be set to send email with Gmail OAuth2."
                ),
            )

        access_token = _refresh_gmail_access_token()
        if not access_token:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Failed to refresh Gmail OAuth2 access token. Check GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN."
                ),
            )

        transport = smtplib.SMTP(smtp_host, smtp_port)
        transport.starttls()
        auth_string = _build_xoauth2_string(smtp_user, access_token)
        code, response = transport.docmd("AUTH", f"XOAUTH2 {auth_string}")
        if code != 235:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Gmail XOAUTH2 authentication failed: "
                    f"{code} {response.decode('utf-8', errors='ignore') if isinstance(response, bytes) else response}"
                ),
            )
        return transport

    if not smtp_host or not smtp_user or not smtp_pass:
        raise HTTPException(
            status_code=503,
            detail=(
                "SMTP is not configured. Set WEBSITE/Sunpost/backend/.env vars: "
                "SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (use a Gmail App Password) or configure Gmail OAuth2."
            ),
        )

    transport = smtplib.SMTP(smtp_host, smtp_port)
    transport.starttls()
    transport.login(smtp_user, smtp_pass)
    return transport


def _send_otp_email(to_email: str, code: str):
    subject = "Your SunPOST verification code"
    body = f"Your verification code is: {code}\n\nThis code expires in {OTP_TTL_SECONDS // 60} minute(s)."

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = (
        os.getenv("GMAIL_SENDER", "").strip() or
        os.getenv("GMAIL_ADDRESS", "").strip() or
        os.getenv("SMTP_USER", "").strip()
    )
    msg["To"] = to_email

    transport = _get_smtp_transport()
    try:
        transport.sendmail(msg["From"], [to_email], msg.as_string())
    finally:
        transport.quit()


@app.get("/", response_class=HTMLResponse)
def read_root():
    return get_dashboard_html()


# --- SIGNUP ENDPOINT ---
from pydantic import BaseModel

class SignUpRequest(BaseModel):
    username: str
    email: str
    password: str

@app.post("/signup")
async def signup(data: SignUpRequest):
    if not firebase_enabled:
        raise HTTPException(status_code=503, detail=f"Firebase not enabled on server. Error: {firebase_error}")
    try:
        user = auth.create_user(
            email=data.email,
            password=data.password,
            display_name=data.username
        )
        return {"uid": user.uid, "email": user.email, "username": user.display_name}
    except Exception as e:
        error_msg = str(e)
        print(f"Signup error: {error_msg}")
        
        # Provide helpful error messages
        if "CONFIGURATION_NOT_FOUND" in error_msg:
            raise HTTPException(
                status_code=400, 
                detail="Email/password authentication is not enabled in your Firebase project. Enable it in Firebase Console > Authentication > Sign-in method > Email/Password."
            )
        elif "already exists" in error_msg.lower():
            raise HTTPException(status_code=400, detail="This email is already registered.")
        else:
            raise HTTPException(status_code=400, detail=f"Signup failed: {error_msg}")


class PublicAuthRequest(BaseModel):
    email: str
    password: str
    username: str | None = None


class FirebaseSessionRequest(BaseModel):
    idToken: str


class RequestOtpRequest(BaseModel):
    idToken: str


class VerifyOtpRequest(BaseModel):
    idToken: str
    otp: str



def is_valid_firebase_api_key(key: str) -> bool:
    return bool(re.match(r'^AIza[0-9A-Za-z\-_]+$', key))


def get_firebase_api_key() -> str:
    key = os.getenv("FIREBASE_WEB_API_KEY", "").strip()
    if key:
        if is_valid_firebase_api_key(key):
            return key
        # Reject numeric-only or invalid placeholder values so auto-fetch can be attempted
        if key.isdigit() or key.upper().startswith('YOUR_') or key == 'YOUR_FIREBASE_WEB_API_KEY_HERE':
            key = ''

    # Attempt to automatically retrieve the Web API key using the service account
    try:
        # Ensure we have a service account path
        cred_path = FIREBASE_CRED_PATH
        if not cred_path or not os.path.exists(cred_path):
            raise RuntimeError("Service account file not available to auto-fetch API key")

        # Read project_id from the service account JSON
        with open(cred_path, 'r') as f:
            sa = json.load(f)
        project_id = sa.get('project_id')
        if not project_id:
            raise RuntimeError('project_id not found in service account file')

        # Use google auth to obtain an access token with Firebase Management scope
        try:
            from google.oauth2 import service_account as ga_service_account
            from google.auth.transport.requests import Request as GARequest
        except Exception as imp_err:
            raise RuntimeError(f'google-auth library is required to auto-fetch API key: {imp_err}')

        scopes = [
            'https://www.googleapis.com/auth/firebase',
            'https://www.googleapis.com/auth/cloud-platform'
        ]
        creds = ga_service_account.Credentials.from_service_account_file(cred_path, scopes=scopes)
        creds.refresh(GARequest())
        token = creds.token
        if not token:
            raise RuntimeError('Failed to obtain access token for service account')

        # List web apps for the project and fetch config for the first web app found
        list_url = f'https://firebase.googleapis.com/v1beta1/projects/{project_id}/webApps'
        req = urllib.request.Request(list_url, headers={
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json'
        })
        with urllib.request.urlopen(req, timeout=20) as resp:
            apps_resp = json.load(resp)

        apps = apps_resp.get('apps', [])
        if not apps:
            raise RuntimeError('No web apps registered in Firebase project to retrieve apiKey')

        # Pick the first web app and request its config
        first_app = apps[0]
        # name is like projects/{projectId}/webApps/{appId}
        app_name = first_app.get('name')
        if not app_name:
            raise RuntimeError('Invalid web app entry from Firebase Management API')

        config_url = f'https://firebase.googleapis.com/v1beta1/{app_name}/config'
        req2 = urllib.request.Request(config_url, headers={
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json'
        })
        with urllib.request.urlopen(req2, timeout=20) as cfg_resp:
            cfg = json.load(cfg_resp)

        api_key = cfg.get('apiKey') or cfg.get('api_key')
        if not api_key:
            raise RuntimeError('apiKey not present in web app config')

        # Cache it in the environment for the running process
        os.environ['FIREBASE_WEB_API_KEY'] = api_key
        print('Auto-fetched FIREBASE_WEB_API_KEY from Firebase Management API')
        return api_key

    except HTTPException:
        raise
    except Exception as e:
        # Fall back to the original behavior: raise an HTTPException with helpful instructions
        raise HTTPException(
            status_code=503,
            detail=(
                "FIREBASE_WEB_API_KEY is not set and automatic retrieval failed: "
                f"{e}. Set a valid Firebase Web API key in Sunpost/backend/.env (it must start with 'AIza') or register a web app in Firebase Console."
            )
        )


def get_firebase_web_config() -> dict:
    key = os.getenv("FIREBASE_WEB_API_KEY", "").strip()
    app_id = os.getenv("FIREBASE_APP_ID", "").strip()
    if key and is_valid_firebase_api_key(key) and app_id:
        project_id = get_firebase_project_id()
        return {
            "apiKey": key,
            "projectId": project_id,
            "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN", f"{project_id}.firebaseapp.com"),
            "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET", f"{project_id}.appspot.com"),
            "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID", ""),
            "appId": app_id,
        }

    cred_path = FIREBASE_CRED_PATH
    if not cred_path or not os.path.exists(cred_path):
        raise HTTPException(status_code=503, detail="Service account file is not available.")

    with open(cred_path, 'r') as f:
        sa = json.load(f)
    project_id = sa.get('project_id')
    if not project_id:
        raise HTTPException(status_code=503, detail="project_id not found in service account file.")

    try:
        from google.oauth2 import service_account as ga_service_account
        from google.auth.transport.requests import Request as GARequest
    except Exception as imp_err:
        raise HTTPException(status_code=503, detail=f"google-auth library is required to auto-fetch Firebase web config: {imp_err}")

    scopes = [
        'https://www.googleapis.com/auth/firebase',
        'https://www.googleapis.com/auth/cloud-platform'
    ]
    creds = ga_service_account.Credentials.from_service_account_file(cred_path, scopes=scopes)
    creds.refresh(GARequest())
    token = creds.token
    if not token:
        raise HTTPException(status_code=503, detail="Failed to obtain access token for service account.")

    list_url = f'https://firebase.googleapis.com/v1beta1/projects/{project_id}/webApps'
    req = urllib.request.Request(list_url, headers={
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json'
    })
    with urllib.request.urlopen(req, timeout=20) as resp:
        apps_resp = json.load(resp)

    apps = apps_resp.get('apps', [])
    if not apps:
        raise HTTPException(status_code=503, detail="No web apps registered in Firebase project to retrieve config.")

    app_name = apps[0].get('name')
    if not app_name:
        raise HTTPException(status_code=503, detail="Invalid web app entry from Firebase Management API.")

    config_url = f'https://firebase.googleapis.com/v1beta1/{app_name}/config'
    req2 = urllib.request.Request(config_url, headers={
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json'
    })
    with urllib.request.urlopen(req2, timeout=20) as cfg_resp:
        cfg = json.load(cfg_resp)

    api_key = cfg.get('apiKey') or cfg.get('api_key')
    if api_key:
        os.environ['FIREBASE_WEB_API_KEY'] = api_key

    return {
        "apiKey": api_key,
        "projectId": cfg.get("projectId") or project_id,
        "authDomain": cfg.get("authDomain") or f"{project_id}.firebaseapp.com",
        "storageBucket": cfg.get("storageBucket") or f"{project_id}.appspot.com",
        "messagingSenderId": cfg.get("messagingSenderId") or "",
        "appId": cfg.get("appId") or "",
    }


def get_firebase_project_id() -> str:
    cred_path = FIREBASE_CRED_PATH
    if not cred_path or not os.path.exists(cred_path):
        raise HTTPException(status_code=503, detail="Service account file is not available.")
    with open(cred_path, "r") as f:
        service_account = json.load(f)
    project_id = service_account.get("project_id")
    if not project_id:
        raise HTTPException(status_code=503, detail="project_id not found in service account file.")
    return project_id


@app.get("/firebase-client-config")
def firebase_client_config():
    return get_firebase_web_config()


def firebase_sign_in(email: str, password: str) -> dict:
    api_key = get_firebase_api_key()
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"
    request_data = json.dumps({
        "email": email,
        "password": password,
        "returnSecureToken": True
    }).encode("utf-8")
    req = urllib.request.Request(url, data=request_data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            return json.load(response)
    except urllib.error.HTTPError as e:
        error_data = json.load(e)
        message = error_data.get("error", {}).get("message", "Authentication failed")
        raise HTTPException(status_code=400, detail=message)
    except urllib.error.URLError as e:
        raise HTTPException(status_code=503, detail=f"Unable to reach Firebase Auth service: {e.reason}")


@app.post("/public/signup")
async def public_signup(data: PublicAuthRequest):
    if not firebase_enabled:
        raise HTTPException(status_code=503, detail=f"Firebase not enabled on server. Error: {firebase_error}")
    try:
        user = auth.create_user(
            email=data.email,
            password=data.password,
            display_name=data.username or None
        )
        return {"uid": user.uid, "email": user.email, "username": user.display_name}
    except Exception as e:
        error_msg = str(e)
        print(f"Public signup error: {error_msg}")
        if "already exists" in error_msg.lower():
            raise HTTPException(status_code=400, detail="This email is already registered.")
        raise HTTPException(status_code=400, detail=f"Signup failed: {error_msg}")


@app.post("/public/login")
async def public_login(data: PublicAuthRequest):
    if not firebase_enabled:
        raise HTTPException(status_code=503, detail=f"Firebase not enabled on server. Error: {firebase_error}")
    sign_in_result = firebase_sign_in(data.email, data.password)
    return {
        "email": sign_in_result.get("email"),
        "localId": sign_in_result.get("localId"),
        "idToken": sign_in_result.get("idToken"),
        "refreshToken": sign_in_result.get("refreshToken"),
        "expiresIn": sign_in_result.get("expiresIn"),
    }


@app.post("/public/firebase-session")
async def firebase_session(data: FirebaseSessionRequest):
    if not firebase_enabled:
        raise HTTPException(status_code=503, detail=f"Firebase not enabled on server. Error: {firebase_error}")
    try:
        decoded = auth.verify_id_token(data.idToken)
        user = auth.get_user(decoded["uid"])
        providers = [provider.provider_id for provider in user.provider_data]
        return {
            "uid": user.uid,
            "email": user.email,
            "username": user.display_name or user.email,
            "displayName": user.display_name,
            "photoURL": user.photo_url,
            "providers": providers,
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Firebase session verification failed: {e}")


def _get_verified_exp(uid: str) -> float | None:
    return verified_store.get(uid)


@app.post("/public/request-otp")
async def request_otp(data: RequestOtpRequest):
    # Verify Firebase session
    if not firebase_enabled:
        raise HTTPException(status_code=503, detail=f"Firebase not enabled on server. Error: {firebase_error}")

    try:
        decoded = auth.verify_id_token(data.idToken)
        user = auth.get_user(decoded["uid"])
        uid = user.uid
        email = user.email
        if not email:
            raise HTTPException(status_code=400, detail="This Google account has no email address available in Firebase.")

        now = time.time()

        # Rate limiting per UID
        last_req = last_request_store.get(uid)
        if last_req and (now - last_req) < OTP_RATE_LIMIT_SECONDS:
            raise HTTPException(
                status_code=429,
                detail=f"Too many requests. Please wait {int(OTP_RATE_LIMIT_SECONDS - (now - last_req))}s and try again.",
            )

        # Generate + store OTP
        code = _generate_otp_code(6)
        code_hash = _hash_otp(code)
        expires_at = now + OTP_TTL_SECONDS

        otp_store[uid] = {
            "code_hash": code_hash,
            "expires_at": expires_at,
            "email": email,
        }
        last_request_store[uid] = now

        # Send email
        _send_otp_email(email, code)

        return {"ok": True, "expiresAt": int(expires_at)}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"OTP request failed: {e}")


@app.post("/public/verify-otp")
async def verify_otp(data: VerifyOtpRequest):
    if not firebase_enabled:
        raise HTTPException(status_code=503, detail=f"Firebase not enabled on server. Error: {firebase_error}")

    try:
        decoded = auth.verify_id_token(data.idToken)
        user = auth.get_user(decoded["uid"])
        uid = user.uid

        if uid not in otp_store:
            raise HTTPException(status_code=400, detail="No OTP requested. Please request a code first.")

        entry = otp_store[uid]
        now = time.time()
        if now > entry["expires_at"]:
            otp_store.pop(uid, None)
            raise HTTPException(status_code=400, detail="OTP expired. Please request a new code.")

        provided_otp = (data.otp or "").strip()
        if not provided_otp:
            raise HTTPException(status_code=400, detail="OTP is required.")

        provided_hash = _hash_otp(provided_otp)
        if not hmac.compare_digest(provided_hash, entry["code_hash"]):
            raise HTTPException(status_code=400, detail="Invalid OTP. Please try again.")

        # Mark verified for a short duration (reuse OTP TTL)
        verified_store[uid] = now + OTP_TTL_SECONDS
        # Clear OTP so it can’t be reused
        otp_store.pop(uid, None)

        return {"ok": True, "verified": True, "verifiedExpiresAt": int(verified_store[uid])}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"OTP verification failed: {e}")



@app.get("/diagnostics")
def diagnostics():
    """Check firebase and firestore configuration"""
    return {
        "firebase_enabled": firebase_enabled,
        "firebase_error": firebase_error,
        "firestore_enabled": firestore_enabled,
        "firestore_error": firestore_error,
        "realtime_enabled": realtime_enabled,
        "realtime_error": realtime_error,
        "service_account_path": FIREBASE_CRED_PATH,
        "service_account_exists": os.path.exists(FIREBASE_CRED_PATH),
        "message": "Visit /test-firestore and /test-realtime to test database connectivity"
    }


@app.get("/test-firestore")
def test_firestore():
    """Test Firestore connection by writing test data"""
    if not firestore_enabled:
        raise HTTPException(
            status_code=503,
            detail=f"Firestore not enabled. Error: {firestore_error}"
        )
    
    try:
        # Get Firestore client
        db = firestore.client()
        
        # Write test data to Firestore
        test_data = {
            "test": "This is a test document",
            "timestamp": datetime.now().isoformat(),
            "status": "success",
            "message": "Connection to Firestore successful!"
        }
        
        # Write to a test collection
        doc_ref = db.collection("tests").document("connection_test")
        doc_ref.set(test_data)
        
        # Read it back to confirm
        doc = doc_ref.get()
        if doc.exists:
            return {
                "success": True,
                "message": "Successfully wrote and read test data from Firestore",
                "data_written": test_data,
                "data_read": doc.to_dict()
            }
        else:
            raise HTTPException(status_code=500, detail="Data was written but could not be read back")
            
    except Exception as e:
        error_msg = str(e)
        print(f"Firestore test error: {error_msg}")
        raise HTTPException(
            status_code=500,
            detail=f"Firestore test failed: {error_msg}"
        )


@app.get("/test-realtime")
def test_realtime():
    """Test Realtime Database connection by writing test data"""
    if not realtime_enabled:
        raise HTTPException(
            status_code=503,
            detail=f"Realtime Database not enabled. Error: {realtime_error}"
        )

    try:
        ref = db.reference("tests/connection_test")
        test_data = {
            "test": "This is a realtime test document",
            "timestamp": datetime.now().isoformat(),
            "status": "success",
            "message": "Connection to Realtime Database successful!"
        }
        ref.set(test_data)
        data = ref.get()
        return {
            "success": True,
            "message": "Successfully wrote and read test data from Realtime Database",
            "data_written": test_data,
            "data_read": data
        }
    except Exception as e:
        error_msg = str(e)
        print(f"Realtime test error: {error_msg}")
        raise HTTPException(
            status_code=500,
            detail=f"Realtime test failed: {error_msg}"
        )
