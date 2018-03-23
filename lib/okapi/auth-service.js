const TokenStorage = require('./token-storage');

// Logs into Okapi and persists token for subsequent use
module.exports = class AuthService {
  constructor(okapiRepository) {
    this.okapi = okapiRepository;
    this.tokenStorage = new TokenStorage();
  }

  login(username, password) {
    this.tokenStorage.clearToken();
    return this.okapi.authn.login(username, password)
      .then((response) => {
        const token = response.headers.get('x-okapi-token');
        this.tokenStorage.setToken(token);
        return token;
      });
  }

  logout() {
    this.tokenStorage.clearToken();
    return Promise.resolve();
  }

  getToken() {
    const token = this.tokenStorage.getToken();
    return Promise.resolve(token);
  }
};
