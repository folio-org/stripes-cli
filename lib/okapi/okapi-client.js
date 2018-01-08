const fetch = require('node-fetch-npm');
const url = require('url');
const TokenStorage = require('./token-storage');

module.exports = class OkapiClient {
  constructor(okapi, tenant) {
    this.tokenStorage = new TokenStorage();
    this.okapiBase = url.parse(okapi);
    this.tenant = tenant;
  }

  get(resource, okapiOptions) {
    const options = { method: 'GET' };
    return fetch(this._url(resource), this._options(options, okapiOptions));
  }

  post(resource, body, okapiOptions) {
    const options = {
      method: 'POST',
      body: JSON.stringify(body),
    };
    return fetch(this._url(resource), this._options(options, okapiOptions));
  }

  put(resource, body, okapiOptions) {
    const options = {
      method: 'PUT',
      body: JSON.stringify(body),
    };
    return fetch(this._url(resource), this._options(options, okapiOptions));
  }

  delete(resource, okapiOptions) {
    const options = { method: 'DELETE' };
    return fetch(this._url(resource), this._options(options, okapiOptions));
  }

  _url(resource) {
    const { path } = url.parse(resource);
    return url.resolve(this.okapiBase, path);
  }

  _options(options, okapiOverrides) {
    const okapiOptions = {
      tenant: this.tenant,
      token: this.tokenStorage.getToken(),
    };
    Object.assign(okapiOptions, okapiOverrides);

    const headers = {
      'content-type': 'application/json',
    };
    if (okapiOptions.token) {
      headers['x-okapi-token'] = okapiOptions.token;
    }
    if (okapiOptions.tenant) {
      headers['x-okapi-tenant'] = okapiOptions.tenant;
    }

    return Object.assign({}, options, { headers });
  }
};
