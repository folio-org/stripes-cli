const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// [argv.okapi, argv.port, argv.proxyHost, argv.proxyPort]);
const OKAPI = process.argv[2];
const PORT = process.argv[3];
const PROXY_HOST = process.argv[4];
const PROXY_PORT = process.argv[5];

app.use(
  '/',
  createProxyMiddleware({
    target: OKAPI,
    changeOrigin: true,
    on: {
      proxyRes: (proxyRes) => {
        // STCOM-247: overwrite any CORS headers in responses with those of
        // the proxy, thus allowing access from any browser pointed at the proxy.
        proxyRes.headers['Access-Control-Allow-Origin'] = `${PROXY_HOST}:${PORT}`;
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';

        // STCOM-248: omit STS headers in responses, thus allowing non-ssl access,
        // e.g. access via http://localhost:3000
        delete proxyRes.headers['Strict-Transport-Security'];
      },
    },
  }),
);

app.listen(PROXY_PORT);
