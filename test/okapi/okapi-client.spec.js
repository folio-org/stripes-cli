import { expect } from 'chai';

import OkapiClient from '../../lib/okapi/okapi-client.js';
import TokenStorage from '../../lib/okapi/token-storage.js';


describe('The okapi-client', function () {
  beforeEach(function () {
    this.sut = new OkapiClient('http://localhost:9130', 'diku');
    this.sut.tokenStorage = new TokenStorage();

    this.sut.tokenStorage.setToken('test-token');
    this.sut.tokenStorage.getAccessCookie = () => null;
    this.sut.tokenStorage.getRefreshCookie = () => null;
  });

  describe('_options method', function () {
    it('applies default headers', async function () {
      const result = await this.sut._options({ method: 'POST', body: 'test-body' });
      expect(result).to.be.an('object').with.property('headers');
      expect(result.headers).to.have.property('content-type', 'application/json');
      expect(result.headers).to.have.property('x-okapi-token', 'test-token');
      expect(result.headers).to.have.property('x-okapi-tenant', 'diku');
    });

    it('does not apply x-okapi-token when token option is false', async function () {
      const result = await this.sut._options({ method: 'POST', body: 'test-body' }, { token: false });
      expect(result).to.be.an('object').with.property('headers');
      expect(result.headers).to.have.property('content-type', 'application/json');
      expect(result.headers).to.not.have.property('x-okapi-token');
      expect(result.headers).to.have.property('x-okapi-tenant', 'diku');
    });

    it('does not apply x-okapi-tenant when tenant option is false', async function () {
      const result = await this.sut._options({ method: 'POST', body: 'test-body' }, { tenant: false });
      expect(result.headers).to.have.property('content-type', 'application/json');
      expect(result).to.be.an('object').with.property('headers');
      expect(result.headers).to.have.property('x-okapi-token', 'test-token');
      expect(result.headers).to.not.have.property('x-okapi-tenant');
    });

    describe('cookies', () => {
      it('sends AT when not expired', async function () {
        const at = {
          key: 'folioAccessToken',
          value: 'at',
          expires: new Date(Date.now() + 5000).toISOString(),
        };
        this.sut.tokenStorage.getAccessCookie = () => at;
        const result = await this.sut._options({ method: 'POST', body: 'test-body' });
        expect(result.headers).to.have.property('content-type', 'application/json');
        expect(result).to.be.an('object').with.property('headers');
        expect(result.headers.cookie).to.equal(`${at.key}=${at.value}`);
      });

      it('RT exchange fails when RT is expired', async function () {
        const at = {
          key: 'folioAccessToken',
          value: 'at',
          expires: new Date(Date.now() - 5000).toISOString(),
        };
        const rt = {
          key: 'folioAccessToken',
          value: 'rt',
          expires: new Date(Date.now() - 5000).toISOString(),
        };

        this.sut.tokenStorage.getAccessCookie = () => at;
        this.sut.tokenStorage.getRefreshCookie = () => rt;
        let didError = false;
        try {
          await this.sut._options({ method: 'POST', body: 'test-body' });
        } catch (e) {
          expect(e).to.match(/Refresh token expired/);
          didError = true;
        }
        expect(didError).to.equal(true);
      });

      it('RT exchange succeeds when RT is not expired', async function () {
        const at = {
          key: 'folioAccessToken',
          value: 'expired at',
          expires: new Date(Date.now() - 5000).toISOString(),
        };
        const rt = {
          key: 'folioAccessToken',
          value: 'valid rt',
          expires: new Date(Date.now() + 5000).toISOString(),
        };

        const getStub = () => {
          return Promise.resolve({
            ok: true,
            headers: {
              get: () => null,
              raw: () => ({
                'set-cookie': [
                  'folioAccessToken=access_token; Max-Age=600; Expires=Fri, 08 Sep 2023 18:18:13 GMT; Path=/; Secure; HTTPOnly; SameSite=None',
                  'folioRefreshToken=refresh_token; Max-Age=604800; Expires=Fri, 15 Sep 2023 18:08:13 GMT; Path=/authn; Secure; HTTPOnly; SameSite=None'
                ],
              }),
            }
          });
        };

        this.sut.tokenStorage.getAccessCookie = () => at;
        this.sut.tokenStorage.getRefreshCookie = () => rt;

        let didError = false;
        try {
          await this.sut._exchangeToken(getStub);
        } catch (e) {
          didError = true;
        }
        expect(didError).to.equal(false);
      });
    });
  });
});
