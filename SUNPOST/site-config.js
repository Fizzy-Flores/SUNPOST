// Use the configured backend API base if available.
// This lets the frontend talk to a deployed auth backend instead of defaulting to the current origin.
const defaultRenderBackend = "https://sunpost-backend.onrender.com";
const isVercelHost = window.location.hostname.endsWith(".vercel.app");
const isLocalHost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

window.SUNPOST_API_BASE =
  window.SUNPOST_API_BASE ||
  window.SUNPOST_API_BASE_URL ||
  window.SUNPOST_BACKEND_URL ||
  (isVercelHost ? defaultRenderBackend : window.location.origin);

// If no custom backend is provided and we are not on localhost, fall back to the default Firebase functions host.
if (!window.SUNPOST_API_BASE || window.SUNPOST_API_BASE === window.location.origin) {
  const defaultFunctionsHost = `https://${window.location.hostname
    .replace("sunpost-frontend.vercel.app", "sunpost")
    .replace(/^\./, "")}.web.app`;

  if (!window.SUNPOST_API_BASE_URL && !window.SUNPOST_BACKEND_URL && !isLocalHost) {
    window.SUNPOST_API_BASE = defaultFunctionsHost;
  }
}
