const { flatMap } = require('lodash');
const { resolveIfOkapiSays } = require('../okapi/okapi-utils');
const OkapiError = require('./okapi-error');

// Consider renaming to ProxyService
module.exports = class ModuleService {
  constructor(okapiRepository) {
    this.okapi = okapiRepository;
  }

  addModuleDescriptor(moduleDescriptor) {
    return this.okapi.proxy.addModuleDescriptor(moduleDescriptor)
      .then(() => ({ id: moduleDescriptor.id, success: true }))
      .catch(resolveIfOkapiSays('already exists', { id: moduleDescriptor.id, alreadyExists: true }));
  }

  addModuleDescriptors(moduleDescriptors) {
    return moduleDescriptors
      .map(descriptor => (previousResults) => {
        const results = previousResults || [];
        return this.addModuleDescriptor(descriptor).then(result => {
          results.push(result);
          return results;
        });
      })
      .reduce((promiseChain, currentFunction) => promiseChain.then(currentFunction), Promise.resolve());
  }

  removeModuleDescriptor(moduleDescriptor) {
    return this.okapi.proxy.removeModuleDescriptor(moduleDescriptor.id)
      .then(() => ({ id: moduleDescriptor.id, success: true }))
      .catch(resolveIfOkapiSays('module does not exist', { id: moduleDescriptor.id, doesNotExist: true }));
  }

  removeModuleDescriptorIds(moduleDescriptorIds) {
    return moduleDescriptorIds
      .map(id => (previousResults) => {
        const results = previousResults || [];
        return this.removeModuleDescriptor({ id }).then(result => {
          results.push(result);
          return results;
        });
      })
      .reduce((promiseChain, currentFunction) => promiseChain.then(currentFunction), Promise.resolve());
  }

  enableModuleForTenant(moduleDescriptorId, tenant) {
    return this.okapi.proxy.enableModuleForTenant(moduleDescriptorId, tenant)
      .then(() => ({ id: moduleDescriptorId, success: true }))
      .catch(resolveIfOkapiSays('already provided', { id: moduleDescriptorId, alreadyExists: true }));
  }

  enableModulesForTenant(moduleDescriptorIds, tenant) {
    return moduleDescriptorIds
      .map(id => (previousResults) => {
        const results = previousResults || [];
        return this.enableModuleForTenant(id, tenant).then(result => {
          results.push(result);
          return results;
        });
      })
      .reduce((promiseChain, currentFunction) => promiseChain.then(currentFunction), Promise.resolve());
  }

  disableModuleForTenant(moduleDescriptorId, tenant) {
    return this.okapi.proxy.disableModuleForTenant(moduleDescriptorId, tenant)
      .then(() => ({ id: moduleDescriptorId, success: true }));
  }

  disableModulesForTenant(moduleDescriptorIds, tenant) {
    return moduleDescriptorIds
      .map(id => (previousResults) => {
        const results = previousResults || [];
        return this.disableModuleForTenant(id, tenant).then(result => {
          results.push(result);
          return results;
        });
      })
      .reduce((promiseChain, currentFunction) => promiseChain.then(currentFunction), Promise.resolve());
  }

  async listModulesForTenant(tenant, options) {
    const tenantPromise = this.okapi.proxy.getModulesForTenant(tenant)
      .then(response => response.json())
      .then(data => data.map(mod => mod.id));

    // Optionally filter the tenant list with a call to listModules
    if (options && (options.require || options.provide)) {
      const filter = await this.listModules(options);
      const tenantModules = await tenantPromise;
      return Promise.resolve(tenantModules.filter(id => filter.includes(id)));
    }

    // Nothing to filter
    return tenantPromise;
  }

  listModules(options) {
    let promise;
    if (options && options.require) {
      promise = this.okapi.proxy.getModulesThatRequireInterface(options.require);
    } else if (options && options.provide) {
      promise = this.okapi.proxy.getModulesThatProvideInterface(options.provide);
    } else {
      promise = this.okapi.proxy.getModules();
    }
    return promise
      .then(response => response.json())
      .then(data => data.map(mod => mod.id));
  }

  viewModuleDescriptor(moduleDescriptorId) {
    return this.okapi.proxy.getModuleDescriptor(moduleDescriptorId)
      .then(response => response.json());
  }

  viewModuleDescriptors(moduleDescriptorIds) {
    return moduleDescriptorIds.map(modId => (previousResults) => {
      const results = previousResults || [];
      return this.viewModuleDescriptor(modId).then(result => {
        results.push(result);
        return results;
      });
    })
      .reduce((promiseChain, currentFunction) => promiseChain.then(currentFunction), Promise.resolve());
  }

  listModulePermissions(moduleDescriptorIds, expand = false) {
    return this.viewModuleDescriptors(moduleDescriptorIds)
      .then(moduleDescriptors => flatMap(moduleDescriptors, descriptor => descriptor.permissionSets || []))
      .then(permissions => {
        const allPermissionNames = permissions.map(perm => perm.permissionName);
        const subPermissionNames = flatMap(permissions, perm => perm.subPermissions || []);
        return allPermissionNames.filter(name => expand || !subPermissionNames.includes(name));
      });
  }

  // Converts an array of module descriptor ids into a payload for okapi's /_/proxy/tenants/{tenant}/install
  // This also accepts an array of objects containing module descriptor ids and actions so that
  // the output of one request can be used as input for another.
  _generateInstallPayload(actionsOrIds, defaultAction) {
    const isActions = actionsOrIds[0].id;
    if (isActions) {
      // We already have objects, so just apply a default action if necessary
      return actionsOrIds.map(mod => {
        mod.action = mod.action || defaultAction || 'enable';
        return mod;
      });
    } else {
      // An array of ids only, so map to objects with an action
      return actionsOrIds.map(id => {
        return { id, action: defaultAction || 'enable' };
      });
    }
  }

  installModulesForTenant(moduleDescriptorIds, tenant, options) {
    const installOptions = {
      deploy: options.deploy || false,
      simulate: options.simulate || false,
      preRelease: options.preRelease || false,
    };
    const modulePayload = this._generateInstallPayload(moduleDescriptorIds, options.action);
    const promise = this.okapi.proxy.installModulesForTenant(modulePayload, tenant, installOptions);
    return promise.then(response => response.json());
  }

  simulateInstallModulesForTenant(moduleDescriptorIds, tenant, options) {
    const simulateOptions = {
      deploy: false,
      simulate: true,
      preRelease: options.preRelease || false,
    };
    const modulePayload = this._generateInstallPayload(moduleDescriptorIds, options.action);
    const promise = this.okapi.proxy.installModulesForTenant(modulePayload, tenant, simulateOptions);
    return promise.then(response => response.json());
  }

  filterFrontendModules(actionsOrIds) {
    const isActions = actionsOrIds[0].id;
    if (isActions) {
      return actionsOrIds.filter(mod => mod.id.startsWith('folio_'));
    } else {
      return actionsOrIds.filter(mod => mod.startsWith('folio_'));
    }
  }

  filterBackendModules(actionsOrIds) {
    const isActions = actionsOrIds[0].id;
    if (isActions) {
      return actionsOrIds.filter(mod => !mod.id.startsWith('folio_'));
    } else {
      return actionsOrIds.filter(mod => !mod.startsWith('folio_'));
    }
  }

  deployBackendModulesForTenantWithActions(moduleDescriptorActions, tenant, options) {
    const deployOptions = {
      deploy: true,
      simulate: options.simulate || false,
      preRelease: options.preRelease || false,
    };

    // Filter out front-end modules
    const moduleActions = this.filterBackendModules(moduleDescriptorActions);
    const promise = this.okapi.proxy.installModulesForTenant(moduleActions, tenant, deployOptions);
    return promise.then(response => response.json());
  }

  installFrontendModulesForTenantWithActions(moduleDescriptorActions, tenant, options) {
    const installOptions = {
      deploy: false,
      simulate: options.simulate || false,
      preRelease: options.preRelease || false,
    };

    // Filter out back-end modules
    const moduleActions = this.filterFrontendModules(moduleDescriptorActions);
    const promise = this.okapi.proxy.installModulesForTenant(moduleActions, tenant, installOptions);
    return promise.then(response => response.json());
  }

  // TODO: Handle this more like upgrading a module
  // Update a Stripes UI module descriptor by first removing any associated tenants
  updateModuleDescriptor(moduleDescriptor) {
    let tenant;

    return this.removeModuleDescriptor(moduleDescriptor)
      .catch((error) => {
        if (error instanceof OkapiError && error.message.includes('is used by tenant')) {
          // TODO: Establish a more elegant way of extracting the tenant id(s) and handle case for multiple
          const split = error.message.split(' ');
          tenant = split[split.length - 1];
          return this.disableModuleForTenant(moduleDescriptor.id, tenant)
            .then(() => this.removeModuleDescriptor(moduleDescriptor));
        } else {
          throw error;
        }
      })
      .then(() => this.addModuleDescriptor(moduleDescriptor))
      .then(() => {
        if (tenant) {
          return this.enableModuleForTenant(moduleDescriptor.id, tenant);
        }
        return Promise.resolve({ id: moduleDescriptor.id, success: true });
      });
  }

  pullModuleDescriptorsFromRemote(remoteUrl) {
    const remoteUrlPayload = {
      urls: [remoteUrl],
    };

    return this.okapi.proxy.pullModuleDescriptorsFromRemote(remoteUrlPayload)
      .then(response => response.json())
      .then(data => data.map(mod => mod.id));
  }
};
