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
    this.accessCookieKey = 'okapi.accessCookie';
    this.refreshCookieKey = 'okapi.refreshCookie';
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

  setAccessCookie(value) {
    this.config.set(this.accessCookieKey, value);
  }

  setRefreshCookie(value) {
    this.config.set(this.refreshCookieKey, value);
  }

  getAccessCookie() {
    return this.config.get(this.accessCookieKey);
  }

  getRefreshCookie() {
    return this.config.get(this.refreshCookieKey);
  }

  clearAccessCookie() {
    this.config.set(this.accessCookieKey, '');
  }

  clearRefreshCookie() {
    this.config.set(this.refreshCookieKey, '');
  }
};
