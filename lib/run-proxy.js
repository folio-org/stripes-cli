const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

const OKAPI = process.argv[2];
const PORT = process.argv[3];

app.use(
  '/',
  createProxyMiddleware({
    target: OKAPI,
    changeOrigin: true,
  }),
);

app.listen(PORT);
