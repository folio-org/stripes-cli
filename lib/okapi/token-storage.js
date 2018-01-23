const Configstore = require('configstore');

const storageKey = '@folio/stripes-cli';

const storageDefault = {
  okapi: {
    token: '',
  },
};

module.exports = class TokenStorage {
  constructor() {
    this.config = new Configstore(storageKey, storageDefault);
    this.tokenKey = 'okapi.token';
  }

  setToken(token) {
    this.config.set(this.tokenKey, token);
  }

  getToken() {
    return this.config.get(this.tokenKey);
  }

  clearToken() {
    return this.config.set(this.tokenKey, '');
  }
};
