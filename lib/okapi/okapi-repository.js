import OkapiClient from './okapi-client.js';

// Use this when x-okapi-tenant and x-okapi-token headers should not be provided
const noTenantNoToken = {
  tenant: false,
  token: false,
};

let okapiClient = {};

function login(username, password) {
  return okapiClient.post('/authn/login-with-expiry', { username, password });
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

function getModulesThatRequireInterface(moduleInterface) {
  return okapiClient.get(`/_/proxy/modules?require=${moduleInterface}`, noTenantNoToken);
}

function getModulesThatProvideInterface(moduleInterface) {
  return okapiClient.get(`/_/proxy/modules?provide=${moduleInterface}`, noTenantNoToken);
}

function installModulesForTenant(modulePayload, tenant, options) {
  return okapiClient.post(`/_/proxy/tenants/${tenant}/install?simulate=${options.simulate}&deploy=${options.deploy}&preRelease=${options.preRelease}`, modulePayload, noTenantNoToken);
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

function getInstances(serviceId) {
  return okapiClient.get(`/_/discovery/modules/${serviceId}`, noTenantNoToken);
}

function addInstance(descriptor) {
  return okapiClient.post('/_/discovery/modules', descriptor, noTenantNoToken);
}

function removeInstances(serviceId) {
  return okapiClient.delete(`/_/discovery/modules/${serviceId}`, noTenantNoToken);
}


// Provides quick access to Okapi API routes within Stripes CLI
const okapiRoutes = {
  authn: {
    login,
  },
  discovery: {
    getInstances,
    addInstance,
    removeInstances,
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
    pullModuleDescriptorsFromRemote,
    getModulesThatRequireInterface,
    getModulesThatProvideInterface,
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

export default function OkapiRepository(okapi, tenant) {
  okapiClient = new OkapiClient(okapi, tenant);
  return okapiRoutes;
}
