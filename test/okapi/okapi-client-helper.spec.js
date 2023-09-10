const expect = require('chai').expect;
const OkapiClient = require('../../lib/okapi/okapi-client');
const OkapiError = require('../../lib/okapi/okapi-error');
const TokenStorage = require('../../lib/okapi/token-storage');
const {
  ensureOk,
  optionsHeaders,
  optionsBody,
  okapiFetch,
} = require('../../lib/okapi/okapi-client-helper');


// const OkapiError = require('./okapi-error');
// const logger = require('../cli/logger')('okapi');

describe('okapi-client-helpers', function () {
  beforeEach(function () {
    this.sut = new OkapiClient('http://localhost:9130', 'diku');
    this.sut.tokenStorage = new TokenStorage();

    this.sut.tokenStorage.setToken('test-token');
    this.sut.tokenStorage.getAccessCookie = () => null;
    this.sut.tokenStorage.getRefreshCookie = () => null;
  });

  describe('ensureOk', function () {
    it('returns response when OK', async function () {
      const res = {
        ok: true,
        status: 'status',
        statusText: 'statusText',
      };

      const r = ensureOk(res);
      expect(r.status).to.equal(res.status);
      expect(r.statusText).to.equal(res.statusText);
    });

    it('throws OkapiError when not OK', async function () {
      const res = {
        ok: false,
        text: () => Promise.resolve('message'),
      };
      let didError = false;
      try {
        const r = await ensureOk(res);
      } catch (e) {
        didError = true;
        expect(e instanceof OkapiError).to.be.true;
      }
      expect(didError).to.be.true;
    });
  });

  describe('optionsHeaders', function () {
    it('maps headers to curl options', () => {
      const o = { headers: { foo: 'foo', bar: 'bar' } };
      const res = optionsHeaders(o);
      expect(res).to.match(/-H 'foo: foo'/);
      expect(res).to.match(/-H 'bar: bar'/);
    });

    it('handles empty headers', () => {
      const res = optionsHeaders({ headers: null });
      expect(res).to.equal('');
    });
  });

  describe('optionsBody', function () {
    it('stringifies body', () => {
      const o = { body: { foo: 'foo' } };

      const res = optionsBody(o);
      expect(res).to.match(/-d {"foo":"foo"}/);
    });

    it('handles empty body', () => {
      const res = optionsBody({ body: null });
      expect(res).to.equal('');
    });
  });
});
