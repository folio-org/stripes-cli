const fetch = require('node-fetch-npm');
const url = require('url');
const logger = require('../cli/logger')('okapi');
const TokenStorage = require('./token-storage');
const OkapiError = require('./okapi-error');

// Ensures the operation return with a 2xx status code
function ensureOk(response) {
  logger.log(`<--- ${response.status} ${response.statusText}`);
  if (response.ok) {
    return response;
  }
  return response.text().then((message) => {
    throw new OkapiError(response, message);
  });
}

// Wraps fetch to capture request/response for logging
function okapiFetch(resource, options) {
  logger.log(`---> ${options.method} ${resource}`);
  return fetch(resource, options).then(ensureOk);
}

module.exports = class OkapiClient {
  constructor(okapi, tenant) {
    this.tokenStorage = new TokenStorage();
    this.okapiBase = url.parse(okapi);
    this.tenant = tenant;
  }

  get(resource, okapiOptions) {
    const options = { method: 'GET' };
    return okapiFetch(this._url(resource), this._options(options, okapiOptions));
  }

  post(resource, body, okapiOptions) {
    const options = {
      method: 'POST',
      body: JSON.stringify(body),
    };
    return okapiFetch(this._url(resource), this._options(options, okapiOptions));
  }

  put(resource, body, okapiOptions) {
    const options = {
      method: 'PUT',
      body: JSON.stringify(body),
    };
    return okapiFetch(this._url(resource), this._options(options, okapiOptions));
  }

  delete(resource, okapiOptions) {
    const options = { method: 'DELETE' };
    return okapiFetch(this._url(resource), this._options(options, okapiOptions));
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
