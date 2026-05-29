# Firebase Login Setup Guide

The login page has been updated to use Firebase for authentication and user verification.

## Configuration

### 1. Add Firebase Credentials to Your HTML

To enable Firebase authentication on the frontend, add your Firebase configuration to the `login.html` head section or load it from environment variables.

**Option A: Use Environment Variables (Recommended)**

In your HTML page, add these script tags before `firebase-config.js`:

```html
<script>
  window.FIREBASE_API_KEY = "YOUR_API_KEY";
  window.FIREBASE_PROJECT_ID = "YOUR_PROJECT_ID";
  window.FIREBASE_AUTH_DOMAIN = "YOUR_AUTH_DOMAIN";
  window.FIREBASE_STORAGE_BUCKET = "YOUR_STORAGE_BUCKET";
  window.FIREBASE_MESSAGING_SENDER_ID = "YOUR_SENDER_ID";
  window.FIREBASE_APP_ID = "YOUR_APP_ID";
</script>
```

**Option B: Update `firebase-config.js`**

Edit [firebase-config.js](firebase-config.js) and replace the placeholder values with your Firebase credentials.

### 2. Verify Backend Firebase Setup

Ensure your backend (`WEBSITE/CREDENTIALS/API/app.py`) has:
- `FIREBASE_WEB_API_KEY` environment variable set
- Firebase service account credentials available
- The `/public/login` endpoint configured

## How It Works

1. **Frontend Verification**: When a user logs in, Firebase Web SDK verifies credentials on the client side
2. **Backend Verification**: The request is also verified against Firebase on the backend
3. **User Status Check**: 
   - Verifies user exists in Firebase
   - Checks if account is enabled (not disabled)
   - Handles rate limiting for failed attempts
4. **Error Handling**: User-friendly error messages for common issues:
   - Account not found
   - Wrong password
   - Account disabled
   - Too many login attempts

## Features Added

✅ Client-side Firebase authentication verification
✅ Server-side Firebase verification confirmation
✅ Detailed error messages for login failures
✅ Rate limiting protection against brute force attacks
✅ Support for account disabling/enabling
✅ User UID tracking for additional security

## Files Modified

- [login.html](login.html) - Added Firebase SDK scripts
- [auth.js](auth.js) - Updated with `verifyUserWithFirebase()` function
- [firebase-config.js](firebase-config.js) - New Firebase configuration file (create this)

## Testing

1. Open [login.html](login.html) in your browser
2. Ensure your Firebase project is configured
3. Try logging in with a valid Firebase user account
4. Verify error messages appear for invalid credentials

## Two-Factor Authentication (SMS) Setup

To enable Firebase SMS multi-factor authentication for your app, do the following in the Firebase console:

1. Open **Authentication** → **Sign-in method**.
2. Enable the **Phone** sign-in provider.
3. Open **Authentication** → **Multi-factor authentication**.
4. Enable **SMS multi-factor authentication** and configure a default phone number.
5. If you are testing locally, add one or more **test phone numbers** under the Phone provider section.

Your frontend now supports:
- SMS 2FA enrollment from `Account.html`
- SMS 2FA prompt during login when the user has a phone second factor enrolled

## Environment Variables (Backend)

Make sure your backend has these set:

```bash
FIREBASE_WEB_API_KEY=your_firebase_api_key
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

## Authorized Domains for Google Sign-In

⚠️ **IMPORTANT**: To enable Google Sign-in and other authentication providers, you must add your website's domain to Firebase's authorized domains list.

📖 **See detailed instructions**: [FIREBASE_AUTHORIZED_DOMAINS_SETUP.md](../FIREBASE_AUTHORIZED_DOMAINS_SETUP.md)

### Quick Steps:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `finals-project-database`
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Add your domain(s):
   - `localhost` (for local development)
   - `127.0.0.1` (for local development)
   - Your production domain (when deployed)
5. Enable **Google** provider in **Authentication** → **Sign-in method**

Without adding authorized domains, you'll see errors like:
- "This domain is not authorized"
- "auth/unauthorized-domain"
- Google Sign-in popup closes immediately

## Troubleshooting

- **"Firebase not initialized"**: Check that Firebase credentials are properly set
- **"No account found"**: Verify the email is registered in your Firebase project
- **"Too many requests"**: Wait a few minutes before trying again
- **CORS errors**: Verify your backend CORS settings allow the frontend domain
- **"This domain is not authorized"**: Add your domain to Firebase authorized domains (see above)
- **Google Sign-in not working**: Check [FIREBASE_AUTHORIZED_DOMAINS_SETUP.md](../FIREBASE_AUTHORIZED_DOMAINS_SETUP.md)
