const API_BASE = window.SUNPOST_API_BASE || 'http://localhost:8000';

// Prefer backend-backed Firebase auth when the backend is available.
let firebaseConfigured = false;
let firebaseInitialized = false;

function hasFirebaseAuth() {
    if (typeof firebase === 'undefined') return false;
    if (typeof firebaseConfig === 'undefined') return false;
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('YOUR_FIREBASE_API_KEY')) return false;
    if (!firebaseConfig.projectId || firebaseConfig.projectId.includes('YOUR_FIREBASE_PROJECT_ID')) return false;
    if (!firebaseConfig.authDomain || firebaseConfig.authDomain.includes('YOUR_FIREBASE_AUTH_DOMAIN')) return false;
    if (!window.SUNPOST_FIREBASE_INITIALIZED) return false;
    if (!firebase.apps || !firebase.apps.length) return false;
    return typeof firebase.auth === 'function';
}

async function ensureFirebaseAuthReady() {
  if (hasFirebaseAuth()) {
    return true;
  }

  // Prefer awaiting the deterministic init promise.
  if (window.SUNPOST_FIREBASE_CONFIG_INIT_PROMISE) {
    try {
      await window.SUNPOST_FIREBASE_CONFIG_INIT_PROMISE;
    } catch (_) {
      // Error is surfaced via window.SUNPOST_FIREBASE_READY_ERROR.
    }
  } else if (window.SUNPOST_FIREBASE_CONFIG_READY) {
    try {
      await window.SUNPOST_FIREBASE_CONFIG_READY;
    } catch (_) {
      // ignore
    }
  } else if (typeof window.SUNPOST_LOAD_FIREBASE_CONFIG === 'function') {
    try {
      const p = window.SUNPOST_LOAD_FIREBASE_CONFIG();
      if (p && typeof p.then === 'function') {
        await p;
      }
    } catch (_) {
      // ignore
    }
  }

  return hasFirebaseAuth();
}

function isAuthenticated() {
  if (getCurrentUser()) return true;
  if (hasFirebaseAuth() && firebase.auth().currentUser) return true;
  return false;
}

function isOtpVerified() {
  const currentUser = getCurrentUser();
  if (!currentUser || !currentUser.uid) return false;
  const key = `SUNPOST_OTP_VERIFIED_${currentUser.uid}`;
  const expiresAt = Number(sessionStorage.getItem(key) || 0);
  const now = Math.floor(Date.now() / 1000);
  return expiresAt && now < expiresAt;
}

function isOtpRequired() {
  const currentUser = getCurrentUser();
  return Boolean(currentUser && currentUser.otpRequired);
}

function setOtpVerified(expiresAtSeconds) {
  const currentUser = getCurrentUser();
  if (!currentUser || !currentUser.uid) return;
  const key = `SUNPOST_OTP_VERIFIED_${currentUser.uid}`;
  sessionStorage.setItem(key, String(expiresAtSeconds));
}

function getOtpPendingKey(uid) {
  return `SUNPOST_OTP_PENDING_${uid}`;
}

function isOtpPending() {
  const currentUser = getCurrentUser();
  if (!currentUser || !currentUser.uid) return false;
  const expiresAt = Number(sessionStorage.getItem(getOtpPendingKey(currentUser.uid)) || 0);
  const now = Math.floor(Date.now() / 1000);
  return expiresAt && now < expiresAt;
}

function setOtpPending(expiresAtSeconds) {
  const currentUser = getCurrentUser();
  if (!currentUser || !currentUser.uid) return;
  sessionStorage.setItem(getOtpPendingKey(currentUser.uid), String(expiresAtSeconds));
}

function clearOtpPending() {
  const currentUser = getCurrentUser();
  if (!currentUser || !currentUser.uid) return;
  sessionStorage.removeItem(getOtpPendingKey(currentUser.uid));
}

function clearCurrentUser() {
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.uid) {
    sessionStorage.removeItem(getOtpPendingKey(currentUser.uid));
    sessionStorage.removeItem(`SUNPOST_OTP_VERIFIED_${currentUser.uid}`);
  }
  sessionStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
}

function attachOtpVerifyHandler() {
  const otpForm = document.getElementById('otp-form');
  const otpInput = document.getElementById('otp');
  const messageEl = document.getElementById('otp-message');
  const verifyBtn = document.getElementById('verify-otp-button');

  if (!otpForm || !otpInput || !messageEl || !verifyBtn) return;

  const show = (msg, isError = false) => {
    if (!messageEl) return;
    messageEl.textContent = msg;
    messageEl.classList.toggle('error', isError);
    messageEl.classList.toggle('success', !isError);
  };

  verifyBtn.addEventListener('click', async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        show('Session expired. Please log in again.', true);
        window.location.href = 'login.html';
        return;
      }

      if (!hasFirebaseAuth() || !firebase.auth().currentUser) {
        show('Firebase session not found. Please log in again.', true);
        window.location.href = 'login.html';
        return;
      }

      show('Verifying code...', false);

      const idToken = await firebase.auth().currentUser.getIdToken();
      const otp = (otpInput.value || '').trim();
      if (!otp) {
        show('Please enter the verification code.', true);
        return;
      }

      const data = await postAuth('/public/verify-otp', { idToken, otp });
      if (data && data.verified && data.verifiedExpiresAt) {
        setOtpVerified(data.verifiedExpiresAt);
        clearOtpPending();
        show('Verified! Redirecting...', false);
        setTimeout(() => {
          window.location.href = getAuthRedirectUrl();
        }, 650);
      } else {
        show('Invalid verification. Please try again.', true);
      }
    } catch (e) {
      show(e.message || 'Verification failed.', true);
    }
  });
}

function validateVerifyOtpPage() {
  const page = getPageName();
  if (page !== 'verify-otp.html') return;

  const currentUser = getCurrentUser();
  if (!currentUser || !currentUser.uid) {
    window.location.href = 'login.html';
    return;
  }

  if (!isOtpRequired()) {
    window.location.href = getAuthRedirectUrl();
    return;
  }

  if (!isOtpPending()) {
    window.location.href = 'login.html';
    return;
  }

  if (isOtpVerified()) {
    window.location.href = getAuthRedirectUrl();
  }
}

function getPageName() {
  return (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
}

function enforceAuthFlow() {
  const page = getPageName();
  const protectedPages = ['', 'index.html', 'homepage.html', 'commission.html', 'shops.html', 'account.html'];

  if (!protectedPages.includes(page)) {
    return;
  }

  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  if (!isOtpRequired()) {
    return;
  }

  if (isOtpVerified()) {
    return;
  }

  if (isOtpPending()) {
    window.location.href = 'verify-otp.html';
    return;
  }

  clearCurrentUser();
  window.location.href = 'login.html';
}


async function checkBackendAvailability() {
  try {
    const resp = await fetch(`${API_BASE.replace(/\/$/, '')}/diagnostics`, { method: 'GET' });
    if (!resp.ok) return false;
    const info = await resp.json();
    return Boolean(info && info.firebase_enabled);
  } catch (e) {
    return false;
  }
}

const USER_STORE_KEY = 'SUNPOST_USERS';
const CURRENT_USER_KEY = 'SUNPOST_CURRENT_USER';

function showMessage(target, message, isError = false) {
  target.textContent = message;
  target.classList.toggle('error', isError);
  target.classList.toggle('success', !isError);
}

function getStoredUsers() {
  try {
    return JSON.parse(localStorage.getItem(USER_STORE_KEY) || '{}');
  } catch (error) {
    return {};
  }
}

function saveStoredUsers(users) {
  localStorage.setItem(USER_STORE_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  const sessionUser = sessionStorage.getItem(CURRENT_USER_KEY);
  const localUser = localStorage.getItem(CURRENT_USER_KEY);
  const raw = sessionUser || localUser;
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function setCurrentUser(user, remember = true) {
  const serialized = JSON.stringify(user);
  if (remember) {
    localStorage.setItem(CURRENT_USER_KEY, serialized);
    sessionStorage.removeItem(CURRENT_USER_KEY);
  } else {
    sessionStorage.setItem(CURRENT_USER_KEY, serialized);
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function createLocalUser({ email, password, username, fullName, website }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error('Please provide a valid email address.');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const users = getStoredUsers();
  if (users[normalizedEmail]) {
    throw new Error('An account already exists with this email address.');
  }

  const normalizedUsername = username.trim() || fullName.trim() || normalizedEmail.split('@')[0];
  const usernameTaken = Object.values(users).some((user) => user.username === normalizedUsername);
  if (usernameTaken) {
    throw new Error('That username is already taken. Please choose another one.');
  }

  const user = {
    email: normalizedEmail,
    password,
    username: normalizedUsername,
    fullName: fullName.trim(),
    website: website.trim() || '',
    createdAt: new Date().toISOString(),
    emailVerified: false,
  };
  users[normalizedEmail] = user;
  saveStoredUsers(users);
  return user;
}

function verifyLocalUser(email, password) {
  const normalizedEmail = normalizeEmail(email);
  const users = getStoredUsers();
  const user = users[normalizedEmail];
  if (!user) {
    throw new Error('No account found for that email address.');
  }
  if (user.password !== password) {
    throw new Error('Password is incorrect.');
  }
  return user;
}

function getAuthRedirectUrl() {
  // Main homepage is Homepage.html in this project.
  // Using index.html can cause unnecessary navigation or slow loads.
  return 'Homepage.html';
}


async function parseJsonResponse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text || '{}');
  } catch (error) {
    const snippet = text.trim().replace(/\s+/g, ' ').slice(0, 240);
    throw new Error(
      `Authentication backend returned invalid JSON (${response.status}).` +
        (snippet ? ` Response starts with: ${snippet}` : ' Response was empty.')
    );
  }
}

function postAuth(path, payload) {
  return fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    mode: 'cors',
  }).then(async (response) => {
    const data = await parseJsonResponse(response);
    if (!response.ok) {
      throw new Error(data.detail || data.error || `Authentication failed (${response.status}).`);
    }
    return data;
  });
}

async function verifyFirebaseSessionWithBackend(firebaseUser) {
  const idToken = await firebaseUser.getIdToken();
  return postAuth('/public/firebase-session', { idToken });
}

async function verifyUserWithFirebase(email, password) {
  if (!firebaseConfigured) {
    return verifyLocalUser(email, password);
  }

  return postAuth('/public/login', { email, password });
}

function showEmailVerificationSection() {
  const section = document.getElementById('email-verification-section');
  if (section) {
    section.classList.remove('hidden');
  }
}

function hideEmailVerificationSection() {
  const section = document.getElementById('email-verification-section');
  if (section) {
    section.classList.add('hidden');
  }
}

function showEmailVerificationWarning() {
  const section = document.getElementById('email-verification-warning');
  if (section) {
    section.classList.remove('hidden');
  }
}

function hideEmailVerificationWarning() {
  const section = document.getElementById('email-verification-warning');
  if (section) {
    section.classList.add('hidden');
  }
}

async function sendEmailVerification(user) {
  if (!user) {
    throw new Error('No user is signed in.');
  }
  
  try {
    await user.sendEmailVerification({
      url: window.location.origin + '/login.html',
      handleCodeInApp: false,
    });
    return true;
  } catch (error) {
    throw new Error(error.message || 'Failed to send verification email.');
  }
}

async function checkEmailVerified() {
  const messageEl = document.getElementById('signup-message');
  const user = hasFirebaseAuth() ? firebase.auth().currentUser : null;
  
  if (!user) {
    showMessage(messageEl, 'Session expired. Please sign up again.', true);
    hideEmailVerificationSection();
    return;
  }

  try {
    await user.reload();
    
    if (user.emailVerified) {
      hideEmailVerificationSection();
      await firebase.auth().signOut();
      showMessage(messageEl, 'Email verified successfully! Redirecting to login...', false);
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
    } else {
      showMessage(messageEl, 'Email not yet verified. Please check your inbox and click the verification link.', true);
    }
  } catch (error) {
    showMessage(messageEl, error.message || 'Failed to check verification status.', true);
  }
}

async function resendVerificationEmail() {
  const messageEl = document.getElementById('login-message');
  const user = hasFirebaseAuth() ? firebase.auth().currentUser : null;
  
  if (!user) {
    showMessage(messageEl, 'Please sign in first to resend verification email.', true);
    return;
  }

  try {
    await sendEmailVerification(user);
    showMessage(messageEl, 'Verification email sent! Please check your inbox.', false);
  } catch (error) {
    showMessage(messageEl, error.message || 'Failed to send verification email.', true);
  }
}

async function continueWithGoogle(mode) {
  const messageEl = document.getElementById(mode === 'signup' ? 'signup-message' : 'login-message');
  showMessage(messageEl, 'Preparing Google sign-in...', false);

  try {
    const ok = await ensureFirebaseAuthReady();
    if (!ok) {
      const readyErr = window.SUNPOST_FIREBASE_READY_ERROR;
      showMessage(
        messageEl,
        readyErr
          ? `Google sign-in is not ready. ${readyErr}`
          : 'Google sign-in is not ready. Firebase failed to initialize (check backend /firebase-client-config and Firebase authorized domains).',
        true,
      );
      return;
    }
  } catch (e) {
    const readyErr = window.SUNPOST_FIREBASE_READY_ERROR;
    showMessage(
      messageEl,
      readyErr
        ? `Google sign-in is not ready. ${readyErr}`
        : e?.message || 'Google sign-in is not ready. Firebase initialization threw an error.',
      true,
    );
    return;
  }

  try {
    showMessage(messageEl, 'Opening Google sign-in...', false);
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await firebase.auth().signInWithPopup(provider);
    const firebaseUser = result.user;

    let backendUser;
    try {
      backendUser = await verifyFirebaseSessionWithBackend(firebaseUser);
    } catch (backendError) {
      const backendUrl = API_BASE.replace(/\/$/, '');
      console.warn('Backend auth unavailable; continuing with Firebase-only login.', backendUrl, backendError);
      setCurrentUser(
        {
          email: firebaseUser.email,
          username: firebaseUser.displayName || (firebaseUser.email || '').split('@')[0],
          uid: firebaseUser.uid,
          photoURL: firebaseUser.photoURL || '',
          authProvider: 'google.com',
          emailVerified: firebaseUser.emailVerified,
        },
        true,
      );
      showMessage(
        messageEl,
        `Signed in with Google. Backend auth is unavailable (tried ${backendUrl}). The session is local only.`,
        false,
      );
      setTimeout(() => {
        window.location.href = getAuthRedirectUrl();
      }, 900);
      return;
    }

    setCurrentUser(
      {
        email: backendUser.email || firebaseUser.email,
        username: backendUser.displayName || backendUser.username || firebaseUser.displayName || firebaseUser.email,
        uid: backendUser.uid || firebaseUser.uid,
        photoURL: backendUser.photoURL || firebaseUser.photoURL || '',
        authProvider: 'google.com',
        emailVerified: true,
        otpRequired: true,
      },
      true,
    );

    // Request Gmail OTP and require user to verify before entering.
    const idToken = await firebaseUser.getIdToken();
    await postAuth('/public/request-otp', { idToken });
    setOtpPending(Math.floor(Date.now() / 1000) + 300);

    showMessage(messageEl, 'Verification code sent to your Gmail. Redirecting...', false);
    setTimeout(() => {
      window.location.href = 'verify-otp.html';
    }, 900);
  } catch (error) {
    if (error && error.code === 'auth/popup-blocked') {
      showMessage(messageEl, 'Popup was blocked. Redirecting to Google sign-in...', false);
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await firebase.auth().signInWithRedirect(provider);
      return;
    }

    // Surface the underlying reason (unauthorized domain, misconfig, etc.)
    const baseMsg = error && (error.message || error.error?.message);
    showMessage(
      messageEl,
      baseMsg || 'Google sign-in failed. Check Firebase console logs and authorized domains.',
      true,
    );
  }
}

async function finishGoogleRedirectSignIn() {
  const page = getPageName();
  if (!['login.html', 'signup.html'].includes(page)) {
    return;
  }

  const ok = await ensureFirebaseAuthReady();
  if (!ok) {
    const messageEl = document.getElementById(page === 'signup.html' ? 'signup-message' : 'login-message');
    const readyErr = window.SUNPOST_FIREBASE_READY_ERROR;
    if (messageEl) {
      showMessage(
        messageEl,
        readyErr ? `Google sign-in is not ready. ${readyErr}` : 'Google sign-in is not ready. Firebase failed to initialize.',
        true,
      );
    }
    return;
  }

  try {
    const result = await firebase.auth().getRedirectResult();
    if (!result || !result.user) {
      return;
    }
    const messageEl = document.getElementById(page === 'signup.html' ? 'signup-message' : 'login-message');
    showMessage(messageEl, 'Finishing Google sign-in...', false);

    let backendUser;
    try {
      backendUser = await verifyFirebaseSessionWithBackend(result.user);
    } catch (backendError) {
      const backendUrl = API_BASE.replace(/\/$/, '');
      console.warn('Backend auth unavailable during redirect sign-in; continuing with Firebase-only login.', backendUrl, backendError);
      setCurrentUser(
        {
          email: result.user.email,
          username: result.user.displayName || (result.user.email || '').split('@')[0],
          uid: result.user.uid,
          photoURL: result.user.photoURL || '',
          authProvider: 'google.com',
          emailVerified: result.user.emailVerified,
        },
        true,
      );
      showMessage(
        messageEl,
        `Signed in with Google. Backend auth is unavailable (tried ${backendUrl}). The session is local only.`,
        false,
      );
      setTimeout(() => {
        window.location.href = getAuthRedirectUrl();
      }, 900);
      return;
    }

    setCurrentUser(
      {
        email: backendUser.email || result.user.email,
        username: backendUser.displayName || backendUser.username || result.user.displayName || result.user.email,
        uid: backendUser.uid || result.user.uid,
        photoURL: backendUser.photoURL || result.user.photoURL || '',
        authProvider: 'google.com',
        emailVerified: true,
        otpRequired: true,
      },
      true,
    );

    // Request Gmail OTP and require user to verify before entering.
    const idToken = await result.user.getIdToken();
    await postAuth('/public/request-otp', { idToken });
    setOtpPending(Math.floor(Date.now() / 1000) + 300);

    showMessage(messageEl, 'Verification code sent to your Gmail. Redirecting...', false);
    setTimeout(() => {
      window.location.href = 'verify-otp.html';
    }, 900);
  } catch (error) {
    const messageEl = document.getElementById(page === 'signup.html' ? 'signup-message' : 'login-message');
    if (messageEl) {
      showMessage(messageEl, error.message || 'Google sign-in failed.', true);
    }
  }
}

function redirectIfAuthenticated() {
  const page = getPageName();
  const currentUser = getCurrentUser();
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  // Prevent redirect loops / flickering: only redirect away from login/signup pages.
  const isAuthEntryPage = ['login.html', 'signup.html'].includes(page);
  if (!isAuthEntryPage) return;

  if (!currentUser || (!loginForm && !signupForm)) {
    return;
  }

  if (!isOtpRequired()) {
    window.location.href = getAuthRedirectUrl();
    return;
  }

  if (isOtpPending()) {
    window.location.href = 'verify-otp.html';
    return;
  }

  // Only redirect authenticated users after OTP verification.
  if (!isOtpVerified()) {
    return;
  }

  window.location.href = getAuthRedirectUrl();
}


async function handleSignup(event) {
  event.preventDefault();
  const form = document.getElementById('signup-form');
  const messageEl = document.getElementById('signup-message');
  const fullName = form.fullName.value.trim();
  const email = form.email.value.trim();
  const username = form.username.value.trim();
  const password = form.password.value;
  const confirmPassword = form.confirmPassword.value;
  const website = form.website.value.trim();
  const termsAccepted = form.terms.checked;

  showMessage(messageEl, 'Signing up...', false);

  if (!termsAccepted) {
    showMessage(messageEl, 'Please accept the terms and services.', true);
    return;
  }

  if (password !== confirmPassword) {
    showMessage(messageEl, 'Passwords do not match.', true);
    return;
  }

  // If the backend supports Firebase, prefer it for signup.
  if (hasFirebaseAuth()) {
    try {
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;
      
      if (firebaseUser && firebaseUser.updateProfile) {
        await firebaseUser.updateProfile({
          displayName: username || fullName || firebaseUser.displayName || '',
        });
      }
      
      // Send email verification and require the user to sign in again on the login page.
      await sendEmailVerification(firebaseUser);
      await firebase.auth().signOut();
      showMessage(messageEl, 'Account created! A verification email has been sent to ' + email + '. Redirecting to login...', false);
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1400);
    } catch (error) {
      showMessage(messageEl, error.message || 'Firebase signup failed.', true);
    }
    return;
  }

  if (!firebaseConfigured) {
    try {
      const backendAvailable = await checkBackendAvailability();
      if (backendAvailable) firebaseConfigured = true;
    } catch (e) {
      // ignore and fallback to local
    }
  }

  if (!firebaseConfigured) {
    try {
      const createdUser = createLocalUser({
        email,
        password,
        username,
        fullName,
        website,
      });
      showMessage(messageEl, 'Account created successfully! Please sign in to continue.', false);
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1200);
    } catch (error) {
      showMessage(messageEl, error.message, true);
    }
    return;
  }
  
  // Backend signup path
  postAuth('/public/signup', {
    email,
    password,
    username: username || fullName || 'SunPost user',
  })
    .then(async (data) => {
      // Attempt to sign the user in client-side and request OTP automatically
      showMessage(messageEl, 'Account created. Signing in and requesting verification code...', false);
      if (hasFirebaseAuth()) {
        try {
          const userCred = await firebase.auth().signInWithEmailAndPassword(email, password);
          const idToken = await userCred.user.getIdToken();
          await postAuth('/public/request-otp', { idToken });
          // Mark pending OTP for ~5 minutes so the verify page behaves correctly
          try { setOtpPending(Math.floor(Date.now() / 1000) + 300); } catch (e) {}
          showMessage(messageEl, 'OTP sent to your email. Redirecting to verification...', false);
          setTimeout(() => {
            window.location.href = 'verify-otp.html';
          }, 1200);
          return;
        } catch (err) {
          console.warn('Auto sign-in or OTP request failed:', err);
          showMessage(messageEl, 'Account created. Please sign in to request verification code.', true);
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 1400);
          return;
        }
      }

      // Fallback: no Firebase available client-side — just redirect to login
      showMessage(messageEl, 'Account created successfully! Please sign in to continue.', false);
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1400);
    })
    .catch((error) => {
      showMessage(messageEl, error.message, true);
    });
}

async function handleLogin(event) {
  event.preventDefault();
  const form = document.getElementById('login-form');
  const messageEl = document.getElementById('login-message');
  const email = form.email.value.trim();
  const password = form.password.value;
  const rememberMe = form.remember && form.remember.checked;

  showMessage(messageEl, 'Signing in...', false);

  // If Firebase auth is available, use it first.
  if (hasFirebaseAuth()) {
    try {
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;
      
      // Check if email is verified
      if (!firebaseUser.emailVerified) {
        showEmailVerificationWarning();
        showMessage(messageEl, 'Please verify your email before logging in. Check your inbox for the verification link.', true);
        // Keep user signed in to allow resending verification email
        return;
      }
      
      hideEmailVerificationWarning();
      setCurrentUser(
        {
          email: firebaseUser.email,
          username: firebaseUser.displayName || email.split('@')[0],
          uid: firebaseUser.uid,
          photoURL: firebaseUser.photoURL || '',
          emailVerified: true,
          otpRequired: true,
        },
        rememberMe,
      );

      try {
        const idToken = await firebaseUser.getIdToken();
        await postAuth('/public/request-otp', { idToken });
        setOtpPending(Math.floor(Date.now() / 1000) + 300);
        showMessage(messageEl, 'OTP sent to your Gmail. Redirecting to verification...', false);
        setTimeout(() => {
          window.location.href = 'verify-otp.html';
        }, 900);
        return;
      } catch (otpError) {
        console.warn('OTP request failed:', otpError);
        showMessage(messageEl, 'Signed in successfully, but OTP request failed. Please try again.', true);
        return;
      }
    } catch (error) {
      showMessage(messageEl, error.message || 'Firebase sign in failed.', true);
    }
    return;
  }

  firebaseConfigured = hasFirebaseAuth();
  if (!firebaseConfigured) {
    try {
      const backendAvailable = await checkBackendAvailability();
      if (backendAvailable) firebaseConfigured = true;
    } catch (e) {
      // ignore, fall back to local
    }
  }

  if (!firebaseConfigured) {
    try {
      const authenticatedUser = verifyLocalUser(email, password);
      setCurrentUser({ email: authenticatedUser.email, username: authenticatedUser.username, emailVerified: true }, rememberMe);
      showMessage(messageEl, 'Signed in successfully! Redirecting...', false);
      setTimeout(() => {
        window.location.href = getAuthRedirectUrl();
      }, 900);
    } catch (error) {
      showMessage(messageEl, error.message, true);
    }
    return;
  }

  // Use backend public login
  postAuth('/public/login', { email, password })
    .then((data) => {
      setCurrentUser({ email: data.email, username: data.email, emailVerified: true }, rememberMe);
      showMessage(messageEl, 'Signed in successfully! Redirecting...', false);
      setTimeout(() => {
        window.location.href = getAuthRedirectUrl();
      }, 1100);
    })
    .catch((error) => {
      showMessage(messageEl, error.message || (error.detail || 'Authentication failed.'), true);
    });
}

function attachFormHandlers() {
  enforceAuthFlow();

  // OTP verification page bootstrap
  if (getPageName() === 'verify-otp.html') {
    validateVerifyOtpPage();
    attachOtpVerifyHandler();
    return;
  }

  finishGoogleRedirectSignIn();


  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
    const signupButton = document.getElementById('signup-button');
    if (signupButton) {
      signupButton.addEventListener('click', handleSignup);
    }
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
    const loginButton = document.getElementById('login-button');
    if (loginButton) {
      loginButton.addEventListener('click', handleLogin);
    }
  }

  const googleLoginButton = document.getElementById('google-login-button');
  if (googleLoginButton) {
    googleLoginButton.addEventListener('click', function () {
      continueWithGoogle('login');
    });
  }

  const googleSignupButton = document.getElementById('google-signup-button');
  if (googleSignupButton) {
    googleSignupButton.addEventListener('click', function () {
      continueWithGoogle('signup');
    });
  }

  const emailVerifiedButton = document.getElementById('email-verified-btn');
  if (emailVerifiedButton) {
    emailVerifiedButton.addEventListener('click', checkEmailVerified);
  }

  const resendVerificationButton = document.getElementById('resend-verification-btn');
  if (resendVerificationButton) {
    resendVerificationButton.addEventListener('click', resendVerificationEmail);
  }

  // Attach logout handler if present on the page
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', function (e) {
      e.preventDefault();
      clearCurrentUser();
      if (hasFirebaseAuth() && firebase.auth().currentUser) {
        firebase.auth().signOut();
      }
      window.location.href = 'login.html';
    });
  }

  const createAccountLink = document.getElementById('create-account-link');
  if (createAccountLink) {
    createAccountLink.addEventListener('click', function (e) {
      e.preventDefault();
      if (hasFirebaseAuth() && firebase.auth().currentUser) {
        firebase.auth().signOut().catch(() => {});
      }
      clearCurrentUser();
      window.location.href = 'signup.html';
    });
  }

  redirectIfAuthenticated();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', attachFormHandlers);
} else {
  attachFormHandlers();
}
