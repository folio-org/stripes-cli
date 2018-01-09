const OkapiClient = require('./okapi-client');

// Use this when x-okapi-tenant and x-okapi-token headers should not be provided
const noTenantNoToken = {
  tenant: false,
  token: false,
};

let okapiClient = {};

function login(username, password) {
  return okapiClient.post('/authn/login', { username, password });
}

// Provides quick access to Okapi API routes within Stripes CLI
const okapiRoutes = {
  authn: {
    login,
  },
};

module.exports = function OkapiRepository(okapi, tenant) {
  okapiClient = new OkapiClient(okapi, tenant);
  return okapiRoutes;
};
