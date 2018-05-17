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

function getModulesForTenant(tenant) {
  return okapiClient.get(`/_/proxy/tenants/${tenant}/modules`, noTenantNoToken);
}

function installModulesForTenant(modulePayload, tenant, options) {
  let resource = `/_/proxy/tenants/${tenant}/install`;
  if (options && options.simulate) {
    resource += '?simulate=true';
  }
  return okapiClient.post(resource, modulePayload, noTenantNoToken);
}

function assignPermissionToUser(permissionName, userId) {
  return okapiClient.post(`/perms/users/${userId}/permissions?indexField=userId`, { permissionName });
}

function getUserByUsername(username) {
  return okapiClient.get(`/users?query=username=${username}`);
}

function getUserPermissions(userId) {
  return okapiClient.get(`/perms/users/${userId}/permissions?indexField=userId`);
}

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
    getModulesForTenant,
    installModulesForTenant,
  },
  perms: {
    assignPermissionToUser,
    getUserPermissions,
  },
  users: {
    getUserByUsername,
  },
};

module.exports = function OkapiRepository(okapi, tenant) {
  okapiClient = new OkapiClient(okapi, tenant);
  return okapiRoutes;
};
