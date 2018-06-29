const { resolveIfOkapiSays } = require('../okapi/okapi-utils');
const OkapiError = require('./okapi-error');
const generateModuleDescriptor = require('../cli/generate-module-descriptor');
const path = require('path');
const StripesPlatform = require('../platform/stripes-platform');
const { moduleDescriptorExtras, toFolioName } = require('../environment/inventory');
// TODO: Export via stripe-core Node API
const parser = require('@folio/stripes-core/webpack/stripes-module-parser');
const StripesBuildError = require('@folio/stripes-core/webpack/stripes-build-error');

module.exports = class ModuleService {
  constructor(okapiRepository) {
    this.okapi = okapiRepository;
  }

  static getModuleDescriptorsFromContext(context, configFile, isStrict) {
    const packageJsons = [];

    if (context.type === 'app') {
      packageJsons.push(require(path.join(context.cwd, 'package.json'))); // eslint-disable-line
    } else if (context.type === 'platform') {
      // Initialize a platform to take aliases, if any, into account
      const platform = new StripesPlatform(configFile, context);
      const stripesConfig = platform.getStripesConfig();

      const moduleNames = Object.getOwnPropertyNames(stripesConfig.modules);
      const extraModuleNames = moduleDescriptorExtras.map(mod => toFolioName(mod));

      moduleNames.concat(extraModuleNames).forEach(moduleName => {
        // The StripesModuleParser's constructor takes care of locating a module's package.json
        try {
          const moduleParser = new parser.StripesModuleParser(moduleName, {}, context.cwd, platform.aliases);
          packageJsons.push(moduleParser.packageJson);
        } catch (err) {
          if (err instanceof StripesBuildError && extraModuleNames.includes(moduleName)) {
            // Quietly ignore if the platform doesn't actually have these extra modules
          } else {
            throw (err);
          }
        }
      });
    }

    const descriptors = packageJsons.map(packageJson => generateModuleDescriptor(packageJson, isStrict));
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

  viewModulesForTenant(tenant) {
    return this.okapi.proxy.getModulesForTenant(tenant)
      .then(response => response.json())
      .then(data => data.map(mod => mod.id));
  }

  installModulesForTenant(moduleDescriptorIds, tenant) {
    const modulePayload = moduleDescriptorIds.map(id => {
      return { id, action: 'enable' };
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
