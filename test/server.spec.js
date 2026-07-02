const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const expect = require('chai').expect;
const server = require('../lib/server');

describe('The server module', function () {
  beforeEach(function () {
    this.tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stripes-cli-server-test-'));
    fs.writeFileSync(path.join(this.tmpDir, 'index.html'), '<html></html>');
    this.httpCreateServerSpy = this.sandbox.spy(http, 'createServer');
  });

  afterEach(function () {
    fs.rmSync(this.tmpDir, { recursive: true, force: true });
  });

  describe('csp-file option', function () {
    it('applies the CSP header from the supplied file when serving', function (done) {
      const cspValue = "default-src 'self'";
      const cspFilePath = path.join(this.tmpDir, 'csp.txt');
      fs.writeFileSync(cspFilePath, `${cspValue}\n`);

      server.start(this.tmpDir, { port: 0, cspFile: cspFilePath });

      const httpServer = this.httpCreateServerSpy.returnValues[0];
      httpServer.on('listening', () => {
        const { port } = httpServer.address();
        http.get({ hostname: 'localhost', port, path: '/' }, (res) => {
          expect(res.headers['content-security-policy-report-only']).to.equal(cspValue);
          res.resume();
          httpServer.close(done);
        });
      });
    });

    it('does not set a CSP header when the option is omitted', function (done) {
      server.start(this.tmpDir, { port: 0 });

      const httpServer = this.httpCreateServerSpy.returnValues[0];
      httpServer.on('listening', () => {
        const { port } = httpServer.address();
        http.get({ hostname: 'localhost', port, path: '/' }, (res) => {
          expect(res.headers['content-security-policy-report-only']).to.be.undefined;
          res.resume();
          httpServer.close(done);
        });
      });
    });

    it('logs an error and does not start the server when the csp file does not exist', function () {
      this.sandbox.spy(console, 'error');
      const missingCspPath = path.join(this.tmpDir, 'missing-csp.txt');

      server.start(this.tmpDir, { port: 0, cspFile: missingCspPath });

      expect(console.error).to.have.been.calledWithMatch(`CSP file "${missingCspPath}" does not exist.`);
      expect(this.httpCreateServerSpy).to.not.have.been.called;
    });
  });
});
