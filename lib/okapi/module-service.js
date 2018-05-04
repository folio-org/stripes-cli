const { resolveIfOkapiSays } = require('../okapi/okapi-utils');
const OkapiError = require('./okapi-error');

module.exports = class ModuleDescriptorService {
  constructor(okapiRepository, context) {
    this.okapi = okapiRepository;
    this.context = context;
  }

  addModuleDescriptor(moduleDescriptor) {
    return this.okapi.proxy.addModuleDescriptor(moduleDescriptor)
      .then(() => ({ id: moduleDescriptor.id, success: true }))
      .catch(resolveIfOkapiSays('exists already', { id: moduleDescriptor.id, alreadyExists: true }));
  }

  removeModuleDescriptor(moduleDescriptor) {
    return this.okapi.proxy.removeModuleDescriptor(moduleDescriptor.id)
      .then(() => ({ id: moduleDescriptor.id, success: true }))
      .catch(resolveIfOkapiSays('module does not exist', { id: moduleDescriptor.id, doesNotExist: true }));
  }

  enableModuleForTenant(moduleDescriptor, tenant) {
    return this.okapi.proxy.enableModuleForTenant(moduleDescriptor.id, tenant)
      .then(() => ({ id: moduleDescriptor.id, success: true }))
      .catch(resolveIfOkapiSays('already provided', { id: moduleDescriptor.id, alreadyExists: true }));
  }

  disableModuleForTenant(moduleDescriptor, tenant) {
    return this.okapi.proxy.disableModuleForTenant(moduleDescriptor.id, tenant)
      .then(() => ({ id: moduleDescriptor.id, success: true }));
  }

  viewModulesForTenant(tenant) {
    return this.okapi.proxy.getModulesForTenant(tenant)
      .then(response => response.json())
      .then(data => data.map(mod => mod.id));
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
          return this.disassociateModuleWithTenant(moduleDescriptor, tenant)
            .then(() => this.removeModuleDescriptor(moduleDescriptor));
        } else {
          throw error;
        }
      })
      .then(() => this.addModuleDescriptor(moduleDescriptor))
      .then(() => {
        if (tenant) {
          return this.associateModuleWithTenant(moduleDescriptor, tenant);
        }
        return Promise.resolve({ id: moduleDescriptor.id, success: true });
      });
  }
};
