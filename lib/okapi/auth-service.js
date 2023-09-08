const tough = require('tough-cookie');
const TokenStorage = require('./token-storage');

// Logs into Okapi and persists token for subsequent use
module.exports = class AuthService {
  accessCookie = 'folioAccessToken';
  refreshCookie = 'folioRefreshToken';

  constructor(okapiRepository) {
    this.okapi = okapiRepository;
    this.tokenStorage = new TokenStorage();
  }

  /**
   * login
   * Send a login request, then look for cookies (default) or an
   * x-okapi-token header in the response and return it.
   *
   * @param {string} username
   * @param {string} password
   * @returns
   */
  login(username, password) {
    this.tokenStorage.clearToken();
    this.tokenStorage.clearAccessCookie();
    this.tokenStorage.clearRefreshCookie();

    return this.okapi.authn.login(username, password)
      .then((response) => {
        this.saveTokens(response);
      });
  }

  /**
   * saveTokens
   * Extract and store rt/at cookies and the x-okapi-token header
   * from an HTTP response.
   * @param {fetch response} response
   */
  saveTokens(response) {
    const Cookie = tough.Cookie;
    const cookieHeaders = response.headers.raw()['set-cookie'];
    let cookies = null;
    if (Array.isArray(cookieHeaders)) {
      cookies = cookieHeaders.map(Cookie.parse);
    } else {
      cookies = [Cookie.parse(cookieHeaders)];
    }

    if (cookies && cookies.length > 0) {
      cookies.forEach(c => {
        if (c.key === this.accessCookie) {
          this.tokenStorage.setAccessCookie(c);
        }

        if (c.key === this.refreshCookie) {
          this.tokenStorage.setRefreshCookie(c);
        }
      });
    }

    const token = response.headers.get('x-okapi-token');
    if (token) {
      this.tokenStorage.setToken(token);
    }
  }

  logout() {
    this.tokenStorage.clearToken();
    this.tokenStorage.clearAccessCookie();
    this.tokenStorage.clearRefreshCookie();
    return Promise.resolve();
  }

  getAccessCookie() {
    return Promise.resolve(this.tokenStorage.getAccessCookie());
  }

  getRefreshCookie() {
    return Promise.resolve(this.tokenStorage.getRefreshCookie());
  }

  getToken() {
    return Promise.resolve(this.tokenStorage.getToken());
  }
};
