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

function removeModuleDescriptor(moduleDescriptorId) {
  return okapiClient.delete(`/_/proxy/modules/${moduleDescriptorId}`, noTenantNoToken);
}

function getModuleDescriptor(moduleDescriptorId) {
  return okapiClient.get(`/_/proxy/modules/${moduleDescriptorId}`, noTenantNoToken);
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

function getModules() {
  return okapiClient.get('/_/proxy/modules', noTenantNoToken);
}

function installModulesForTenant(modulePayload, tenant) {
  return okapiClient.post(`/_/proxy/tenants/${tenant}/install`, modulePayload, noTenantNoToken);
}

function simulateInstallModulesForTenant(modulePayload, tenant) {
  return okapiClient.post(`/_/proxy/tenants/${tenant}/install?simulate=true`, modulePayload, noTenantNoToken);
}

function pullModuleDescriptorsFromRemote(remoteUrlPayload) {
  return okapiClient.post('_/proxy/pull/modules', remoteUrlPayload, noTenantNoToken);
}

function assignPermissionToUser(permissionName, userId) {
  return okapiClient.post(`/perms/users/${userId}/permissions?indexField=userId`, { permissionName });
}

function unassignPermissionFromUser(permissionName, userId) {
  return okapiClient.delete(`/perms/users/${userId}/permissions/${permissionName}?indexField=userId`);
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
    getModules,
    getModuleDescriptor,
    addModuleDescriptor,
    removeModuleDescriptor,
    enableModuleForTenant,
    disableModuleForTenant,
    getModulesForTenant,
    installModulesForTenant,
    simulateInstallModulesForTenant,
    pullModuleDescriptorsFromRemote,
  },
  perms: {
    assignPermissionToUser,
    getUserPermissions,
    unassignPermissionFromUser,
  },
  users: {
    getUserByUsername,
  },
};

module.exports = function OkapiRepository(okapi, tenant) {
  okapiClient = new OkapiClient(okapi, tenant);
  return okapiRoutes;
};
