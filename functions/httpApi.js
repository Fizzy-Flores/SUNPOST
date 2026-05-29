const admin = require('firebase-admin');

// Simple helper to send JSON responses with CORS
function sendJson(res, status, payload) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = status;
  res.end(JSON.stringify(payload));
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

// Gmail OAuth2 refresh token flow to get access token
async function getGmailAccessToken() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Gmail OAuth2 not configured (GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN)');
  }

  const values = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: values.toString(),
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error_description || data.error || 'Failed to refresh Gmail token');
  if (!data.access_token) throw new Error('No access_token returned from Google');
  return data.access_token;
}

async function sendOtpEmail(to, code) {
  const from = process.env.GMAIL_USER || process.env.GMAIL_FROM;
  if (!from) throw new Error('GMAIL_USER / GMAIL_FROM not configured');

  const accessToken = await getGmailAccessToken();
  const subject = 'SunPOST verification code';
  const message = `Your SunPOST verification code is: ${code}\n\nIt expires in 5 minutes.`;

  const raw = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=UTF-8',
    '',
    message,
  ].join('\r\n');

  const encoded = Buffer.from(raw, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

  await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: encoded }),
  }).then(async (r) => {
    if (!r.ok) {
      const txt = await r.text();
      throw new Error(`Gmail send failed: ${r.status} ${txt}`);
    }
  });
}

function parseJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

// OTP config
const OTP_TTL = 300; // seconds
const OTP_RATE_LIMIT = 60; // seconds between requests per user

// Local in-memory fallback used only for local testing when FIRESTORE emulator
// is not available. Enable with env var FORCE_LOCAL_OTP=true.
const FORCE_LOCAL_OTP = process.env.FORCE_LOCAL_OTP === 'true';
const inMemoryOtpStore = {};
const inMemoryLastRequest = {};

function otpCollection() {
  if (FORCE_LOCAL_OTP) return null;
  return admin.firestore().collection('otps');
}

module.exports = async (req, res) => {
  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.statusCode = 204;
    return res.end();
  }

  const basePath = req.path || new URL(req.url, `https://${req.headers.host}`).pathname;
  // strip any leading /api/ if present
  let route = basePath.replace(/^\/api\//, '').replace(/^\//, '');
  if (!route) route = '';

  try {
    if (route === 'firebase-client-config' && req.method === 'GET') {
      const cfg = {
        apiKey: process.env.FIREBASE_API_KEY || '',
        projectId: process.env.FIREBASE_PROJECT_ID || '',
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.FIREBASE_APP_ID || '',
      };
      return sendJson(res, 200, cfg);
    }

    if (route === 'diagnostics' && req.method === 'GET') {
      const hasFirebase = Boolean(process.env.FIREBASE_API_KEY && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_AUTH_DOMAIN);
      return sendJson(res, 200, { firebase_enabled: hasFirebase, firebase_error: null, email_enabled: Boolean(process.env.GMAIL_USER || process.env.GMAIL_FROM), message: 'Function is running' });
    }

    if (route === 'public/firebase-session' && req.method === 'POST') {
      const body = await parseJson(req);
      if (!body.idToken) return sendError(res, 400, 'idToken required');
      try {
        const decoded = await admin.auth().verifyIdToken(body.idToken);
        const user = await admin.auth().getUser(decoded.uid);
        const providers = (user.providerData || []).map((p) => p.providerId);
        return sendJson(res, 200, { uid: user.uid, email: user.email, username: user.displayName || user.email, displayName: user.displayName, photoURL: user.photoURL || '', providers });
      } catch (e) {
        return sendError(res, 401, `Firebase session verification failed: ${e.message}`);
      }
    }

    if (route === 'public/request-otp' && req.method === 'POST') {
      const body = await parseJson(req);
      if (!body.idToken) return sendError(res, 400, 'idToken required');
      try {
        const decoded = await admin.auth().verifyIdToken(body.idToken);
        const user = await admin.auth().getUser(decoded.uid);
        const email = user.email;
        if (!email) return sendError(res, 400, 'No email for user');
        const now = Math.floor(Date.now() / 1000);
        if (FORCE_LOCAL_OTP) {
          const last = inMemoryLastRequest[decoded.uid] || 0;
          if (last && now - last < OTP_RATE_LIMIT) return sendError(res, 429, `Too many requests`);
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          inMemoryOtpStore[decoded.uid] = { code, expiresAt: now + OTP_TTL, email };
          inMemoryLastRequest[decoded.uid] = now;
          try {
            await sendOtpEmail(email, code);
          } catch (e) {
            return sendError(res, 500, `Failed to send OTP email: ${e.message}`);
          }
          // For local testing return the code so we can verify easily.
          return sendJson(res, 200, { ok: true, expiresAt: inMemoryOtpStore[decoded.uid].expiresAt, dev_code: code });
        }

        const docRef = otpCollection().doc(decoded.uid);
        const doc = await docRef.get();
        if (doc.exists) {
          const data = doc.data();
          const last = data.lastRequestAt || 0;
          if (last && now - last < OTP_RATE_LIMIT) return sendError(res, 429, `Too many requests`);
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const payload = { code, email, expiresAt: now + OTP_TTL, lastRequestAt: now, createdAt: now };
        await docRef.set(payload, { merge: true });

        try {
          await sendOtpEmail(email, code);
        } catch (e) {
          return sendError(res, 500, `Failed to send OTP email: ${e.message}`);
        }

        return sendJson(res, 200, { ok: true, expiresAt: payload.expiresAt });
      } catch (e) {
        return sendError(res, 401, `OTP request failed: ${e.message}`);
      }
    }

    if (route === 'public/verify-otp' && req.method === 'POST') {
      const body = await parseJson(req);
      if (!body.idToken) return sendError(res, 400, 'idToken required');
      if (!body.otp) return sendError(res, 400, 'otp required');
      try {
        const decoded = await admin.auth().verifyIdToken(body.idToken);
        const now = Math.floor(Date.now() / 1000);
        if (FORCE_LOCAL_OTP) {
          const entry = inMemoryOtpStore[decoded.uid];
          if (!entry) return sendError(res, 400, 'No OTP requested');
          if (now > entry.expiresAt) { delete inMemoryOtpStore[decoded.uid]; return sendError(res, 400, 'OTP expired'); }
          if (String(body.otp).trim() !== String(entry.code)) return sendError(res, 400, 'Invalid OTP');
          delete inMemoryOtpStore[decoded.uid];
          return sendJson(res, 200, { ok: true, verified: true, verifiedExpiresAt: now + OTP_TTL });
        }

        const docRef = otpCollection().doc(decoded.uid);
        const doc = await docRef.get();
        if (!doc.exists) return sendError(res, 400, 'No OTP requested');
        const entry = doc.data();
        if (now > entry.expiresAt) {
          await docRef.delete().catch(() => {});
          return sendError(res, 400, 'OTP expired');
        }
        if (String(body.otp).trim() !== String(entry.code)) return sendError(res, 400, 'Invalid OTP');
        await docRef.delete().catch(() => {});
        return sendJson(res, 200, { ok: true, verified: true, verifiedExpiresAt: now + OTP_TTL });
      } catch (e) {
        return sendError(res, 401, `OTP verify failed: ${e.message}`);
      }
    }

    // login/signup via Identity Toolkit REST (requires FIREBASE_API_KEY)
    if ((route === 'public/login' || route === 'public/signup') && req.method === 'POST') {
      const body = await parseJson(req);
      const apiKey = process.env.FIREBASE_API_KEY;
      if (!apiKey) return sendError(res, 500, 'Firebase API key not configured');
      const path = route === 'public/login' ? 'accounts:signInWithPassword' : 'accounts:signUp';
      const payload = { email: body.email, password: body.password, returnSecureToken: true };
      if (route === 'public/signup' && body.username) payload.displayName = body.username;
      try {
        const r = await fetch(`https://identitytoolkit.googleapis.com/v1/${path}?key=${encodeURIComponent(apiKey)}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
        const data = await r.json();
        if (!r.ok) return sendError(res, 400, data.error?.message || JSON.stringify(data));
        return sendJson(res, 200, data);
      } catch (e) {
        return sendError(res, 500, `Auth error: ${e.message}`);
      }
    }

    // default
    return sendError(res, 404, 'Not found');
  } catch (e) {
    return sendError(res, 500, e.message || 'Internal error');
  }
};
