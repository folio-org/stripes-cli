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

function addModuleDescriptor(moduleDescriptor) {
  return okapiClient.post('/_/proxy/modules', moduleDescriptor, noTenantNoToken);
}

function removeModuleDescriptor(moduleDescriptor) {
  return okapiClient.delete(`/_/proxy/modules/${moduleDescriptor}`, noTenantNoToken);
}

function enableModuleForTenant(moduleDescriptorId, tenant) {
  return okapiClient.post(`/_/proxy/tenants/${tenant}/modules`, { id: moduleDescriptorId }, noTenantNoToken);
}

function disableModuleForTenant(moduleDescriptorId, tenant) {
  return okapiClient.delete(`/_/proxy/tenants/${tenant}/modules/${moduleDescriptorId}`, noTenantNoToken);
}

function assignPermissionToUser(permissionName, username) {
  return okapiClient.post(`/perms/users/${username}/permissions`, { permissionName });
}

// resolve and install backend...
// running okapi -pull, get list, issue install (dry run option)
// ask adam re: put to md

// Provides quick access to Okapi API routes within Stripes CLI
const okapiRoutes = {
  authn: {
    login,
  },
  proxy: {
    addModuleDescriptor,
    removeModuleDescriptor,
    enableModuleForTenant,
    disableModuleForTenant,
  },
  perms: {
    assignPermissionToUser,
  },
};

module.exports = function OkapiRepository(okapi, tenant) {
  okapiClient = new OkapiClient(okapi, tenant);
  return okapiRoutes;
};
