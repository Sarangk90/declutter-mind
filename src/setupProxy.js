const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api/anthropic',
    createProxyMiddleware({
      target: 'https://api.anthropic.com',
      changeOrigin: true,
      pathRewrite: {
        '^/api/anthropic': '',
      },
      onProxyReq: (proxyReq, req, res) => {
        // Forward the API key from client headers
        const apiKey = req.headers['x-api-key'];
        if (apiKey) {
          proxyReq.setHeader('x-api-key', apiKey);
        }
        
        // Set required headers for Anthropic API
        proxyReq.setHeader('anthropic-version', '2023-06-01');
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('anthropic-dangerous-direct-browser-access', 'true');
        
        // Remove client-side headers that might cause issues
        proxyReq.removeHeader('origin');
        proxyReq.removeHeader('referer');
      },
      onProxyRes: (proxyRes, req, res) => {
        // Add CORS headers to the response
        proxyRes.headers['access-control-allow-origin'] = '*';
        proxyRes.headers['access-control-allow-methods'] = 'GET,POST,PUT,DELETE,OPTIONS';
        proxyRes.headers['access-control-allow-headers'] = 'Content-Type,x-api-key,anthropic-version,anthropic-dangerous-direct-browser-access';
      }
    })
  );
};