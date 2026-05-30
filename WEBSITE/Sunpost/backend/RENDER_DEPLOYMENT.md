# Sunpost Backend - Render Deployment Guide

## Prerequisites
- Render.com account (create one at https://render.com)
- GitHub repository with your backend code pushed
- Firebase credentials (service-account.json)
- Firebase project details

## Step 1: Prepare Your Repository

Ensure your backend directory structure matches:
```
WEBSITE/Sunpost/backend/
├── main.py
├── auth_middleware.py
├── requirements.txt
├── .env.example
├── Procfile
├── runtime.txt
├── render.yaml
└── README.md
```

## Step 2: Set Up on Render

1. Go to https://render.com and sign in with GitHub
2. Click "New +" → "Web Service"
3. Select your GitHub repository
4. Configure the service:
   - **Name**: `sunpost-backend`
   - **Environment**: `Python 3`
   - **Plan**: Free or Paid (Free tier has 15-min auto-sleep)
   - **Build Command**: `cd WEBSITE/Sunpost/backend && python -m pip install --upgrade pip && python -m pip install -r requirements.txt`
   - **Start Command**: `cd WEBSITE/Sunpost/backend && python -m uvicorn main:app --host 0.0.0.0 --port $PORT`

   This repository now includes a root-level `render.yaml`, a root-level `requirements.txt` that redirects to `WEBSITE/Sunpost/backend/requirements.txt`, and a root-level `Procfile` that starts the backend from the correct subfolder.

   If your service is configured manually in the dashboard instead of using `render.yaml`, set the service root to `WEBSITE/Sunpost/backend` and use the same build/start commands.

## Step 3: Set Environment Variables

In Render dashboard, go to your service's **Environment** tab and add:

### Required Variables
```
FIREBASE_DATABASE_URL=https://<your-project>-default-rtdb.<region>.firebaseio.com
FIREBASE_WEB_API_KEY=AIza... (from Firebase Console → Project Settings)
ADMIN_API_KEY=<generate with: openssl rand -hex 32>
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

### Firebase Service Account (Important)
Render has two methods to handle the service account JSON:

**Option A: Base64 Encode (Recommended)**
1. Encode your `service-account.json`:
   ```bash
   cat WEBSITE/CREDENTIALS/service-account.json | base64
   ```
2. Add in Render as environment variable:
   ```
   FIREBASE_SERVICE_ACCOUNT_B64=<base64-encoded-json>
   ```
3. Update main.py to decode it (add after `load_dotenv()`):
   ```python
   import base64
   
   service_account_b64 = os.getenv("FIREBASE_SERVICE_ACCOUNT_B64")
   if service_account_b64:
       import tempfile
       decoded = base64.b64decode(service_account_b64)
       with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
           f.write(decoded.decode())
           FIREBASE_CRED_PATH = f.name
   ```

> Important: If you use `GOOGLE_APPLICATION_CREDENTIALS` with `fromFile: true`, make sure it is configured as a runtime secret in Render. If it is only scoped to `build`, the backend will start without credential access and Firebase auth will fail.

**Option B: Use Render Secrets (Enterprise)**
Available on paid plans.

## Step 4: Deploy

1. Connect your repository to Render
2. Set environment variables in the dashboard
3. Click "Deploy"
4. Monitor logs in the dashboard

## Step 5: Update Frontend CORS

Update your frontend's API calls to use Render URL:
```javascript
const API_BASE = 'https://sunpost-backend.onrender.com'; // or your custom domain
```

## Troubleshooting

### Build Fails
- Check logs: Render dashboard → Logs tab
- Ensure requirements.txt has all dependencies
- Verify Python version is 3.12

### Runtime Errors
- Check environment variables are set
- Verify Firebase credentials are correct
- Ensure service account JSON is properly encoded/accessible

### Service Sleeps (Free Tier)
- Free tier apps sleep after 15 minutes of inactivity
- Upgrade to paid plan for 24/7 uptime
- Add a ping endpoint and use uptime monitoring to keep it warm

## Useful Render Commands

View logs:
```bash
render logs <service-id>
```

Trigger redeploy:
```bash
# Push to main/master branch to auto-deploy
git push origin main
```

## Production Checklist

- [ ] Firebase credentials securely set
- [ ] API key (`ADMIN_API_KEY`) generated and stored
- [ ] CORS enabled for your frontend domain
- [ ] Environment variables verified
- [ ] Health check endpoint working (`GET /`)
- [ ] Diagnostics accessible (`GET /diagnostics`)
- [ ] Free tier sleep considered (upgrade if needed)
- [ ] Backups of service-account.json in secure location
