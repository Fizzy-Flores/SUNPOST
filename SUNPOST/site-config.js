// Use the configured backend API base if available.
// This lets the frontend talk to a deployed auth backend instead of defaulting to the current origin.
window.SUNPOST_API_BASE =
  window.SUNPOST_API_BASE ||
  window.SUNPOST_API_BASE_URL ||
  window.SUNPOST_BACKEND_URL ||
  window.location.origin;

// If no custom backend is provided, prefer Firebase Functions URL when available.
// This makes production use the Functions endpoint if deployed via Firebase CLI.
if (!window.SUNPOST_API_BASE || window.SUNPOST_API_BASE === window.location.origin) {
  // Default functions host (replaceable by setting window.SUNPOST_API_BASE at runtime)
  const defaultFunctionsHost = `https://${window.location.hostname.replace('sunpost-frontend.vercel.app','sunpost').replace(/^\./,'')}.web.app`;
  // Only set if an env override isn't present.
  if (!window.SUNPOST_API_BASE_URL && !window.SUNPOST_BACKEND_URL) {
    window.SUNPOST_API_BASE = defaultFunctionsHost;
  }
}
