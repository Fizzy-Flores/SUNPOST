const OTP_TTL_SECONDS = 300;
const OTP_RATE_LIMIT_SECONDS = 60;
const otpStore = {};
const lastRequestStore = {};

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function getFirebaseConfig() {
  return {
    apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyDrPVCDrWkXpR-iA5volHO1euBNGGrlKg4',
    projectId: process.env.FIREBASE_PROJECT_ID || 'finals-project-database',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'finals-project-database.firebaseapp.com',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'finals-project-database.appspot.com',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || '',
  };
}

function jsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function base64UrlEncode(value) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error(`Invalid JSON response from ${url}: ${text}`);
  }
  if (!response.ok) {
    const message = data.error?.message || data.error?.errors?.[0]?.message || response.statusText;
    throw new Error(message || `API request failed (${response.status})`);
  }
  return data;
}

async function getGmailAccessToken() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Gmail OAuth2 refresh token is not configured on the backend. Set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET and GMAIL_REFRESH_TOKEN.');
  }

  const values = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const tokenResponse = await fetchJson('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: values.toString(),
  });

  if (!tokenResponse.access_token) {
    throw new Error('Failed to refresh Gmail access token.');
  }

  return tokenResponse.access_token;
}

async function sendOtpEmail(to, code) {
  const from = process.env.GMAIL_USER || process.env.GMAIL_FROM;
  if (!from) {
    throw new Error('GMAIL_USER or GMAIL_FROM is not configured for OTP email sending.');
  }

  const accessToken = await getGmailAccessToken();
  const subject = 'SunPOST verification code';
  const message = `Your SunPOST verification code is: ${code}\n\nEnter this code in the app to complete sign in. It expires in ${Math.round(OTP_TTL_SECONDS / 60)} minutes.`;

  const rawMail = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=UTF-8',
    '',
    message,
  ].join('\r\n');

  const encoded = base64UrlEncode(rawMail);

  await fetchJson('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encoded }),
  });
}

async function verifyFirebaseIdToken(idToken) {
  const config = getFirebaseConfig();
  if (!config.apiKey) {
    throw new Error('Firebase API key is missing in backend configuration.');
  }

  const data = await fetchJson(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(config.apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  const user = data.users && data.users[0];
  if (!user) {
    throw new Error('Invalid Firebase ID token.');
  }

  return user;
}

function getUserFromIdentityToolkitUser(user) {
  return {
    uid: user.localId,
    email: user.email,
    username: user.displayName || user.email,
    displayName: user.displayName,
    photoURL: user.photoUrl || '',
    providers: (user.providerUserInfo || []).map((provider) => provider.providerId),
  };
}

async function requireJson(req, res) {
  if (req.headers['content-type']?.includes('application/json')) {
    return jsonBody(req);
  }
  sendError(res, 400, 'Request body must be JSON.');
  return null;
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  let route = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '');

  if (!route && url.pathname === '/api') {
    route = '';
  }

  if (route === 'firebase-client-config' && req.method === 'GET') {
    return sendJson(res, 200, getFirebaseConfig());
  }

  if (route === 'diagnostics' && req.method === 'GET') {
    const config = getFirebaseConfig();
    return sendJson(res, 200, {
      firebase_enabled: Boolean(config.apiKey && config.projectId && config.authDomain),
      firebase_error: null,
      email_enabled: Boolean(process.env.GMAIL_USER || process.env.GMAIL_FROM),
      message: 'SunPOST backend is running.',
    });
  }

  if (route === 'public/firebase-session' && req.method === 'POST') {
    const body = await requireJson(req, res);
    if (!body) return;
    if (!body.idToken) {
      return sendError(res, 400, 'idToken is required.');
    }
    try {
      const user = await verifyFirebaseIdToken(body.idToken);
      return sendJson(res, 200, getUserFromIdentityToolkitUser(user));
    } catch (error) {
      return sendError(res, 401, `Firebase session verification failed: ${error.message}`);
    }
  }

  if (route === 'public/request-otp' && req.method === 'POST') {
    const body = await requireJson(req, res);
    if (!body) return;
    if (!body.idToken) {
      return sendError(res, 400, 'idToken is required.');
    }
    try {
      const user = await verifyFirebaseIdToken(body.idToken);
      const uid = user.localId;
      const email = user.email;
      if (!email) {
        return sendError(res, 400, 'Firebase account does not have an email address.');
      }

      const now = Math.floor(Date.now() / 1000);
      const lastReq = lastRequestStore[uid] || 0;
      if (lastReq && now - lastReq < OTP_RATE_LIMIT_SECONDS) {
        return sendError(res, 429, `Too many requests. Please wait ${OTP_RATE_LIMIT_SECONDS - (now - lastReq)}s and try again.`);
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = now + OTP_TTL_SECONDS;
      otpStore[uid] = { code, expiresAt, email };
      lastRequestStore[uid] = now;

      try {
        await sendOtpEmail(email, code);
      } catch (emailError) {
        console.warn('OTP email send failed:', emailError.message || emailError);
        return sendError(res, 500, `Failed to send OTP email: ${emailError.message}`);
      }

      return sendJson(res, 200, { ok: true, expiresAt });
    } catch (error) {
      return sendError(res, 401, `OTP request failed: ${error.message}`);
    }
  }

  if (route === 'public/verify-otp' && req.method === 'POST') {
    const body = await requireJson(req, res);
    if (!body) return;
    if (!body.idToken) {
      return sendError(res, 400, 'idToken is required.');
    }
    if (!body.otp) {
      return sendError(res, 400, 'OTP code is required.');
    }
    try {
      const user = await verifyFirebaseIdToken(body.idToken);
      const uid = user.localId;
      const entry = otpStore[uid];
      if (!entry) {
        return sendError(res, 400, 'No OTP requested for this user.');
      }
      const now = Math.floor(Date.now() / 1000);
      if (now > entry.expiresAt) {
        delete otpStore[uid];
        return sendError(res, 400, 'OTP expired. Please request a new code.');
      }
      if (entry.code !== String(body.otp).trim()) {
        return sendError(res, 400, 'Invalid OTP. Please try again.');
      }
      delete otpStore[uid];
      return sendJson(res, 200, { ok: true, verified: true, verifiedExpiresAt: now + OTP_TTL_SECONDS });
    } catch (error) {
      return sendError(res, 401, `OTP verification failed: ${error.message}`);
    }
  }

  if ((route === 'public/login' || route === 'public/signup') && req.method === 'POST') {
    const body = await requireJson(req, res);
    if (!body) return;
    const config = getFirebaseConfig();
    if (!config.apiKey) {
      return sendError(res, 500, 'Firebase API key is not configured on the backend.');
    }

    const path = route === 'public/login' ? 'accounts:signInWithPassword' : 'accounts:signUp';
    const payload = {
      email: body.email,
      password: body.password,
      returnSecureToken: true,
    };
    if (route === 'public/signup' && body.username) {
      payload.displayName = body.username;
    }

    try {
      const signInResult = await fetchJson(`https://identitytoolkit.googleapis.com/v1/${path}?key=${encodeURIComponent(config.apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return sendJson(res, 200, signInResult);
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }

  if (route === '' && req.method === 'GET') {
    return sendJson(res, 200, { ok: true });
  }

  return sendError(res, 404, 'Endpoint not found.');
}

module.exports = async (req, res) => {
  try {
    await handleRequest(req, res);
  } catch (error) {
    console.error('API handler error:', error);
    sendError(res, 500, error.message || 'Internal server error');
  }
};
