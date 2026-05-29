// Firebase Configuration
// Uses backend-provided Firebase web config whenever possible.
// This prevents Google sign-in from failing due to placeholder keys.

const firebaseConfig = {
  apiKey: window.FIREBASE_API_KEY || "AIzaSyDrPVCDrWkXpR-iA5volHO1euBNGGrlKg4",
  projectId: window.FIREBASE_PROJECT_ID || "finals-project-database",
  authDomain: window.FIREBASE_AUTH_DOMAIN || "finals-project-database.firebaseapp.com",
  storageBucket: window.FIREBASE_STORAGE_BUCKET || "finals-project-database.appspot.com",
  messagingSenderId: window.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: window.FIREBASE_APP_ID || "",
};

window.SUNPOST_FIREBASE_CONFIG = firebaseConfig;

function isFirebaseConfigValid(cfg = firebaseConfig) {
  if (!cfg || !cfg.apiKey || cfg.apiKey.includes("YOUR_FIREBASE_API_KEY")) return false;
  if (!cfg.projectId || cfg.projectId.includes("YOUR_FIREBASE_PROJECT_ID")) return false;
  if (!cfg.authDomain || cfg.authDomain.includes("YOUR_FIREBASE_AUTH_DOMAIN")) return false;
  return true;
}

function canInitializeFirebase() {
  return typeof firebase !== 'undefined' && firebase && typeof firebase.initializeApp === 'function';
}

async function initializeFirebaseAuth() {
  if (!canInitializeFirebase()) {
    return false;
  }

  try {
    if (!isFirebaseConfigValid()) {
      return false;
    }

    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    window.SUNPOST_FIREBASE_INITIALIZED = true;
    console.log("Firebase initialized successfully");
    return true;
  } catch (error) {
    window.SUNPOST_FIREBASE_INITIALIZED = false;
    console.error("Firebase initialization error:", error);
    return false;
  }
}

function getBackendApiBase() {
  return (window.SUNPOST_API_BASE || "http://localhost:8000").replace(/\/$/, "");
}

async function loadFirebaseConfigFromBackend() {
  const apiBase = getBackendApiBase();
  const resp = await fetch(`${apiBase}/firebase-client-config`, { method: "GET" });

  // Try to extract server error details to show in UI.
  if (!resp.ok) {
    let serverDetail = "";
    try {
      const data = await resp.json();
      serverDetail = data?.detail ? `: ${data.detail}` : "";
    } catch (e) {
      // ignore
    }
    throw new Error(`Unable to load Firebase web config from backend${serverDetail}`);
  }

  const remoteConfig = await resp.json();

  // Validate backend config before merging.
  // If backend returns placeholders/invalid values, initializing will throw and break Google sign-in.
  const missing = [];
  if (!remoteConfig || typeof remoteConfig !== 'object') {
    missing.push('backend config is not an object');
  } else {
    const checks = [
      ['apiKey', remoteConfig.apiKey],
      ['projectId', remoteConfig.projectId],
      ['authDomain', remoteConfig.authDomain],
    ];

    for (const [key, val] of checks) {
      if (!val || typeof val !== 'string') {
        missing.push(`${key} missing/empty`);
        continue;
      }
      if (val.includes(`YOUR_${key.toUpperCase()}_`)) missing.push(`${key} is placeholder`);
      if (key === 'apiKey' && val.includes('AIza') === false && val.includes('YOUR_')) missing.push(`${key} invalid`);
      if (key !== 'apiKey' && val.includes('YOUR_')) missing.push(`${key} is placeholder`);
    }
  }

  if (missing.length) {
    throw new Error(
      `Backend Firebase web config is invalid/incomplete: ${missing.join('; ')}. ` +
      `Fix Firebase config or /firebase-client-config response.`
    );
  }

  // Merge backend values into local config.
  Object.assign(firebaseConfig, remoteConfig);

  const initialized = await initializeFirebaseAuth();
  if (!initialized) {
    throw new Error(
      "Firebase backend config was fetched, but Firebase failed to initialize. `" +
        "This usually means authDomain/authorized domains or keys are not configured for this web app."
    );
  }

  return true;
}

// Make initialization deterministic and idempotent.
// - First: attempt backend config load (authoritative)
// - Second: fall back to any valid local window.FIREBASE_* values
// - Always expose a promise that resolves/rejects with the real reason.

let firebaseInitInFlight = null;

// Initialize Firebase deterministically and expose a detailed failure reason.
// auth.js uses these signals to show a useful error instead of a generic “not ready”.
window.SUNPOST_FIREBASE_READY_ERROR = null;
window.SUNPOST_FIREBASE_CONFIG_INIT_PROMISE = (async () => {
  try {
    // Wait a tick for firebase scripts (defer) to attach `firebase`.
    await new Promise((r) => setTimeout(r, 0));

    // If already initialized, resolve.
    if (window.SUNPOST_FIREBASE_INITIALIZED && canInitializeFirebase()) return true;

    // If backend config loader is available, try it.
    try {
      firebaseInitInFlight = loadFirebaseConfigFromBackend();
      const ok = await firebaseInitInFlight;
      return ok;
    } catch (e) {
      console.warn("Backend Firebase config load failed; falling back to local config.", e);
      // Keep the backend error around as context.
      if (!window.SUNPOST_FIREBASE_READY_ERROR) {
        window.SUNPOST_FIREBASE_READY_ERROR = e instanceof Error ? e.message : String(e);
      }
    }

    // Fallback: initialize from local placeholders (only if valid).
    const ok = await initializeFirebaseAuth();
    if (!ok) {
      throw new Error(
        "Firebase is not ready (backend config failed and local FIREBASE_* config is missing/invalid)."
      );
    }

    return ok;
  } catch (e) {
    window.SUNPOST_FIREBASE_INITIALIZED = false;
    window.SUNPOST_FIREBASE_READY_ERROR = e instanceof Error ? e.message : String(e);
    throw e;
  }
})();

// Backward compatibility
window.SUNPOST_FIREBASE_CONFIG_READY = window.SUNPOST_FIREBASE_CONFIG_INIT_PROMISE;
window.SUNPOST_LOAD_FIREBASE_CONFIG = () => window.SUNPOST_FIREBASE_CONFIG_INIT_PROMISE;

// Check if user is logged in
function checkAuthStatus(callback) {
  if (typeof firebase !== "undefined" && firebase.auth) {
    firebase.auth().onAuthStateChanged((user) => {
      callback(user);
    });
  }
}

// Sign out user
async function signOutUser() {
  if (typeof firebase !== "undefined" && firebase.auth) {
    try {
      await firebase.auth().signOut();
      localStorage.removeItem("sunpostUser");
      window.location.href = "login.html";
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }
}
