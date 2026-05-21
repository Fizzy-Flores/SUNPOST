// Proxy API requests from /api/* to the FastAPI backend
// Smart routing: connects to the same host the frontend is running on
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      // Route to backend on the same host (localhost or Tailscale IP)
      router: (req) => {
        const hostname = req.get('host').split(':')[0];
        return `http://${hostname}:8000`;
      },
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
    })
  );
};
