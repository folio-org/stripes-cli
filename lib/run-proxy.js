const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

const OKAPI = process.argv[2];
const PROXY_PORT = process.argv[3];
const PORT = process.argv[4];

app.use(
  '/',
  createProxyMiddleware({
    target: OKAPI,
    changeOrigin: true,
    on: {
      proxyRes: (proxyRes) => {
        proxyRes.headers['Access-Control-Allow-Origin'] = `http://localhost:${PORT}`;
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      },
    },
  }),
);

app.listen(PROXY_PORT);
