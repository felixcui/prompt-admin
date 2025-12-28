const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8086',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api'
      },
      filter: function(pathname, req) {
        return pathname.startsWith('/api') && 
          !pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js)$/);
      }
    })
  );
}; 