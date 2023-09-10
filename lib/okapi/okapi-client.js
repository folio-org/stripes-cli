const url = require('url');

const logger = require('../cli/logger')('okapi');
const TokenStorage = require('./token-storage');
const AuthService = require('./auth-service');

const { okapiFetch } = require('./okapi-client-helper');

module.exports = class OkapiClient {
  constructor(okapi, tenant) {
    this.tokenStorage = new TokenStorage();
    this.okapiBase = url.parse(okapi);
    this.tenant = tenant;
  }

  get(resource, okapiOptions) {
    const options = { method: 'GET' };
    return this._options(options, okapiOptions).then(opt => {
      return okapiFetch(this._url(resource), opt);
    });
  }

  post(resource, body, okapiOptions) {
    const options = {
      method: 'POST',
      body: JSON.stringify(body),
    };
    return this._options(options, okapiOptions).then(opt => {
      return okapiFetch(this._url(resource), opt);
    });
  }

  put(resource, body, okapiOptions) {
    const options = {
      method: 'PUT',
      body: JSON.stringify(body),
    };
    return this._options(options, okapiOptions).then(opt => {
      return okapiFetch(this._url(resource), opt);
    });
  }

  delete(resource, okapiOptions) {
    const options = { method: 'DELETE' };
    return this._options(options, okapiOptions).then(opt => {
      return okapiFetch(this._url(resource), opt);
    });
  }

  _url(resource) {
    const { path } = url.parse(resource);
    return url.resolve(this.okapiBase, path);
  }

  /**
   * _exchangesToken
   * Exchange a refresh token, storing the new AT and RT cookies
   * in the AuthService and returning the AT for immediate use.
   * @returns Promise resolving to an AT shaped like tough-cookie.Cookie.
   */
  _exchangeToken(fetchHandler) {
    logger.log('---> refresh token exchange');
    const rt = this.tokenStorage.getRefreshCookie();
    if (new Date(rt.expires).getTime() > new Date().getTime()) {
      const options = {
        credentials: 'include',
        method: 'POST',
        mode: 'cors',
      };

      const headers = {
        'content-type': 'application/json',
        'x-okapi-tenant': this.tenant,
        'cookie': `${rt.key}=${rt.value}`,
      };

      return fetchHandler(this._url('authn/refresh'), { ...options, headers }).then(response => {
        const as = new AuthService();
        as.saveTokens(response);
        return as.getAccessCookie();
      });
    }

    throw new Error(`Refresh token expired at ${rt.expires}`);
  }

  /**
   *
   * @returns Promise
   */
  _accessToken() {
    const at = this.tokenStorage.getAccessCookie();
    if (at) {
      if (((new Date(at.expires)).getTime()) > (new Date().getTime())) {
        return Promise.resolve(at);
      }

      return this._exchangeToken(okapiFetch);
    }

    return Promise.resolve();
  }

  /**
   * _options
   * Configure request options and headers. Returns a promise because
   * the access-token cookie may need to be exchanged for a fresh one,
   * an async process.
   * @param {*} options
   * @param {*} okapiOverrides
   * @returns Promise resolving to an access token
   */
  _options(options, okapiOverrides) {
    const okapiOptions = {
      tenant: this.tenant,
      token: this.tokenStorage.getToken(),
      ...okapiOverrides,
    };

    const headers = {
      'content-type': 'application/json',
    };
    if (okapiOptions.token) {
      headers['x-okapi-token'] = okapiOptions.token;
    }
    if (okapiOptions.tenant) {
      headers['x-okapi-tenant'] = okapiOptions.tenant;
    }

    return this._accessToken()
      .then(at => {
        if (at) {
          headers.cookie = `${at.key}=${at.value}`;
        }

        return { ...options, headers };
      });
  }
};
