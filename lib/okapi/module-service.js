const { resolveIfOkapiSays } = require('../okapi/okapi-utils');
const OkapiError = require('./okapi-error');
const generateModuleDescriptor = require('../cli/generate-module-descriptor');
const path = require('path');
const StripesPlatform = require('../platform/stripes-platform');
// TODO: Export via stripe-core Node API
const parser = require('@folio/stripes-core/webpack/stripes-module-parser');

module.exports = class ModuleService {
  constructor(okapiRepository) {
    this.okapi = okapiRepository;
  }

  static getModuleDescriptorsFromContext(context, configFile) {
    const packageJsons = [];

    if (context.type === 'app') {
      packageJsons.push(require(path.join(context.cwd, 'package.json'))); // eslint-disable-line
    } else if (context.type === 'platform') {
      // Initialize a platform to take aliases, if any, into account
      const platform = new StripesPlatform(configFile, context);
      const stripesConfig = platform.getStripesConfig();

      const moduleNames = Object.getOwnPropertyNames(stripesConfig.modules);
      moduleNames.forEach(moduleName => {
        // The StripesModuleParser's constructor takes care of locating a module's package.json
        // TODO: Wrap with try/catch as this could throw a build error
        const moduleParser = new parser.StripesModuleParser(moduleName, {}, context.cwd, platform.aliases);
        packageJsons.push(moduleParser.packageJson);
      });
    }

    const descriptors = packageJsons.map(packageJson => generateModuleDescriptor(packageJson));
    return descriptors;
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

  installModulesForTenant(modules, tenant) {
    const modulePayload = modules.map(mod => {
      return { id: mod, action: 'enable' };
    });
    return this.okapi.proxy.installModulesForTenant(modulePayload, tenant, { simulate: true });
    // .then(() => ({ id: moduleDescriptor.id, success: true }))
    // .catch(resolveIfOkapiSays('already provided', { id: moduleDescriptor.id, alreadyExists: true }));
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
