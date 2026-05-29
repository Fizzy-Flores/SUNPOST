# Firebase IP Allowlist Configuration for Render Backend

## Your Render Outbound IPs

```
74.220.52.0/24
74.220.60.0/24
```

## How to Add to Firebase

### Step 1: Go to Firebase Console
1. Open https://console.firebase.google.com
2. Select your SunPost project

### Step 2: Navigate to Network Access
1. Click **Project Settings** (gear icon)
2. Go to **Network** tab
3. Look for "Cloud Firestore" or "Realtime Database" section

### Step 3: Add IP Ranges

In the **IP Allowlist** section:

1. Click **Add IP address** or **Add network**
2. Enter the first range:
   ```
   74.220.52.0/24
   ```
3. Click **Save**
4. Click **Add IP address** again
5. Enter the second range:
   ```
   74.220.60.0/24
   ```
6. Click **Save**

### Step 4: Verify

After adding, both IPs should appear in the allowlist:
```
✓ 74.220.52.0/24
✓ 74.220.60.0/24
```

## Why This Matters

Your Render backend connects to Firebase from these IPs. If they're not whitelisted:
- ❌ Backend cannot access Firestore
- ❌ Backend cannot access Realtime Database
- ❌ Auth requests fail

By adding them, you allow Render to communicate securely with Firebase.

## Testing Connection

After adding the IPs, test your backend:

```bash
cd WEBSITE/Sunpost/backend
curl http://localhost:8000/diagnostics
```

Or visit: `https://sunpost-backend.onrender.com/diagnostics`

You should see:
```json
{
  "firebase": "operational",
  "firestore": "operational",
  "realtime_database": "operational"
}
```

## If You Have Issues

**Connection timeout errors?**
- Verify IPs are in allowlist
- Wait a few minutes for changes to propagate
- Check Firebase console confirms IPs are saved

**Still failing?**
- Make sure `GOOGLE_APPLICATION_CREDENTIALS` is set in Render environment
- Verify `FIREBASE_DATABASE_URL` is correct
- Check service account JSON has correct permissions
