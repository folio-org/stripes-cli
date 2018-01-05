const OkapiClient = require('./okapi-client');
const TokenStorage = require('./token-storage');

// Logs into Okapi and persists token for subsequent use
module.exports = class AuthService {
  constructor(okapi, tenant) {
    this.okapi = okapi;
    this.tenant = tenant;
    this.okapiClient = new OkapiClient(okapi, tenant);
    this.tokenStorage = new TokenStorage();
  }

  login(username, password) {
    this.tokenStorage.clearToken();
    return this.okapiClient.post('/authn/login', { username, password }).then((response) => {
      const token = response.headers.get('x-okapi-token');

      // TODO: Verify header/token exists before saving it
      this.tokenStorage.setToken(token);
    });
  }

  logout() {
    this.tokenStorage.clearToken();
    return Promise.resolve();
  }
};
