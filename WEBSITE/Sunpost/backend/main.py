# main.py for Sunpost backend

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import json
import firebase_admin
from firebase_admin import credentials, auth, firestore, db
from dotenv import load_dotenv
from datetime import datetime


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

try:
    if os.path.exists(FIREBASE_CRED_PATH):
        cred = credentials.Certificate(FIREBASE_CRED_PATH)

        # Determine Realtime Database URL
        db_url = os.getenv("FIREBASE_DATABASE_URL")
        if not db_url:
            with open(FIREBASE_CRED_PATH, "r") as f:
                service_info = json.load(f)
            project_id = service_info.get("project_id")
            if project_id:
                db_url = f"https://{project_id}.firebaseio.com"

        # Check if firebase_admin is already initialized
        try:
            firebase_admin.get_app()
        except ValueError:
            # App not initialized, initialize it
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
                db.reference("/")
                realtime_enabled = True
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

app = FastAPI()

# HTML Dashboard for the API
def get_dashboard_html():
    firebase_status = "🟢 Connected" if firebase_enabled else "🔴 Disconnected"
    firestore_status = "🟢 Connected" if firestore_enabled else "🔴 Disconnected"
    realtime_status = "🟢 Connected" if realtime_enabled else "🔴 Disconnected"
    firebase_class = "status-active" if firebase_enabled else "status-inactive"
    firestore_class = "status-active" if firestore_enabled else "status-inactive"
    realtime_class = "status-active" if realtime_enabled else "status-inactive"
    
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sunpost API</title>
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
                color: #e8d5b5;
                min-height: 100vh;
                padding: 40px 20px;
            }}
            
            .container {{
                max-width: 900px;
                margin: 0 auto;
            }}
            
            .header {{
                text-align: center;
                margin-bottom: 50px;
                animation: fadeIn 0.6s ease-in;
            }}
            
            .header h1 {{
                font-size: 3.5em;
                font-weight: 300;
                letter-spacing: 2px;
                margin-bottom: 10px;
                text-shadow: 0 0 20px rgba(232, 213, 181, 0.3);
            }}
            
            .header p {{
                font-size: 1.1em;
                color: #a0886b;
                letter-spacing: 1px;
            }}
            
            .grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 25px;
                margin-bottom: 40px;
            }}
            
            .card {{
                background: rgba(30, 30, 46, 0.8);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(232, 213, 181, 0.1);
                border-radius: 12px;
                padding: 25px;
                transition: all 0.3s ease;
                animation: slideUp 0.6s ease-out;
            }}
            
            .card:hover {{
                transform: translateY(-5px);
                border-color: rgba(232, 213, 181, 0.3);
                box-shadow: 0 8px 30px rgba(232, 213, 181, 0.1);
            }}
            
            .card-title {{
                font-size: 1.4em;
                margin-bottom: 15px;
                color: #e8d5b5;
                font-weight: 600;
            }}
            
            .status {{
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 1.1em;
                margin-bottom: 10px;
            }}
            
            .status-active {{
                color: #4ade80;
            }}
            
            .status-inactive {{
                color: #ef4444;
            }}
            
            .endpoints {{
                background: rgba(30, 30, 46, 0.8);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(232, 213, 181, 0.1);
                border-radius: 12px;
                padding: 30px;
                animation: slideUp 0.7s ease-out;
            }}
            
            .endpoints h2 {{
                font-size: 1.8em;
                margin-bottom: 25px;
                color: #e8d5b5;
            }}
            
            .endpoint {{
                margin-bottom: 20px;
                padding-bottom: 20px;
                border-bottom: 1px solid rgba(232, 213, 181, 0.1);
            }}
            
            .endpoint:last-child {{
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
            }}
            
            .endpoint-method {{
                display: inline-block;
                background: #8b7355;
                color: white;
                padding: 5px 12px;
                border-radius: 4px;
                font-size: 0.85em;
                font-weight: bold;
                margin-right: 10px;
            }}
            
            .endpoint-path {{
                font-family: 'Monaco', 'Courier New', monospace;
                color: #d4b5a0;
                font-size: 1.05em;
                margin-right: 15px;
            }}
            
            .endpoint-desc {{
                color: #a0886b;
                font-size: 0.95em;
                margin-top: 8px;
            }}
            
            .btn {{
                display: inline-block;
                background: #8b7355;
                color: #e8d5b5;
                padding: 10px 20px;
                border-radius: 6px;
                text-decoration: none;
                font-size: 0.9em;
                margin-top: 10px;
                transition: all 0.3s ease;
                border: 1px solid #a0886b;
                cursor: pointer;
            }}
            
            .btn:hover {{
                background: #a0886b;
                transform: translateX(2px);
            }}
            
            @keyframes fadeIn {{
                from {{
                    opacity: 0;
                }}
                to {{
                    opacity: 1;
                }}
            }}
            
            @keyframes slideUp {{
                from {{
                    opacity: 0;
                    transform: translateY(20px);
                }}
                to {{
                    opacity: 1;
                    transform: translateY(0);
                }}
            }}
            
            .footer {{
                text-align: center;
                margin-top: 50px;
                color: #8b7355;
                font-size: 0.9em;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌙 Sunpost API</h1>
                <p>Backend Service for Night Market</p>
            </div>
            
            <div class="grid">
                <div class="card">
                    <div class="card-title">Firebase Auth</div>
                    <div class="status {firebase_class}">{firebase_status}</div>
                    <div class="endpoint-desc">Authentication service</div>
                </div>
                
                <div class="card">
                    <div class="card-title">Firestore Database</div>
                    <div class="status {firestore_class}">{firestore_status}</div>
                    <div class="endpoint-desc">Document database</div>
                </div>
                <div class="card">
                    <div class="card-title">Realtime Database</div>
                    <div class="status {realtime_class}">{realtime_status}</div>
                    <div class="endpoint-desc">Sync database</div>
                </div>
            </div>
            
            <div class="endpoints">
                <h2>Available Endpoints</h2>
                
                <div class="endpoint">
                    <div>
                        <span class="endpoint-method">GET</span>
                        <span class="endpoint-path">/</span>
                    </div>
                    <div class="endpoint-desc">API status (JSON)</div>
                </div>
                
                <div class="endpoint">
                    <div>
                        <span class="endpoint-method">GET</span>
                        <span class="endpoint-path">/diagnostics</span>
                    </div>
                    <div class="endpoint-desc">Detailed Firebase & Firestore diagnostics</div>
                    <a href="/diagnostics" class="btn">View Diagnostics</a>
                </div>
                
                <div class="endpoint">
                    <div>
                        <span class="endpoint-method">GET</span>
                        <span class="endpoint-path">/test-firestore</span>
                    </div>
                    <div class="endpoint-desc">Test Firestore connection by writing & reading test data</div>
                    <a href="/test-firestore" class="btn">Test Firestore</a>
                </div>
                
                <div class="endpoint">
                    <div>
                        <span class="endpoint-method">GET</span>
                        <span class="endpoint-path">/test-realtime</span>
                    </div>
                    <div class="endpoint-desc">Test Realtime Database connection by writing & reading test data</div>
                    <a href="/test-realtime" class="btn">Test Realtime</a>
                </div>
                
                <div class="endpoint">
                    <div>
                        <span class="endpoint-method">POST</span>
                        <span class="endpoint-path">/signup</span>
                    </div>
                    <div class="endpoint-desc">User registration endpoint (requires email/password auth enabled)</div>
                    <div class="endpoint-desc" style="margin-top: 5px; color: #d4b5a0;">
                        Content-Type: application/json<br>
                        Body: {{"username": "string", "email": "string", "password": "string"}}
                    </div>
                </div>
            </div>
            
            <div class="footer">
                <p>🎨 Sunpost Backend v1.0 | Powered by FastAPI + Firebase + Firestore</p>
            </div>
        </div>
    </body>
    </html>
    """

app = FastAPI()

# Enable CORS for frontend
# Allow connections from localhost (development) and Tailscale network
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://100.75.71.126:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
