const path = require('path');
const { uniq } = require('lodash');

// TODO: Export via stripes-core Node API
const parser = require('@folio/stripes-core/webpack/stripes-module-parser');
const StripesBuildError = require('@folio/stripes-core/webpack/stripes-build-error');

const { resolveIfOkapiSays } = require('../okapi/okapi-utils');
const OkapiError = require('./okapi-error');
const generateModuleDescriptor = require('../cli/generate-module-descriptor');
const StripesPlatform = require('../platform/stripes-platform');
const { moduleDescriptorExtras, backendDescriptorExtras, toFolioName } = require('../environment/inventory');

module.exports = class ModuleService {
  constructor(okapiRepository) {
    this.okapi = okapiRepository;
  }

  static getModuleDescriptorsFromContext(context, configFile, isStrict) {
    const packageJsons = [];

    if (context.type === 'platform') {
      // Initialize a platform to take aliases, if any, into account
      const platform = new StripesPlatform(configFile, context);
      const stripesConfig = platform.getStripesConfig();

      const moduleNames = Object.getOwnPropertyNames(stripesConfig.modules);
      const extraModuleNames = moduleDescriptorExtras.map(mod => toFolioName(mod));

      uniq(moduleNames.concat(extraModuleNames)).forEach(moduleName => {
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
    } else {
      packageJsons.push(require(path.join(context.cwd, 'package.json'))); // eslint-disable-line
    }

    const descriptors = packageJsons.map(packageJson => generateModuleDescriptor(packageJson, isStrict));
    return descriptors;
  }

  static extendModuleDescriptorIds(moduleDescriptorIds, manuallyAdded) {
    const automaticallyAdded = backendDescriptorExtras.reduce((accumulator, current) => {
      let found = [];
      // If we have all the matching prerequisites, more module ids are included
      if (current.match && current.match.every(name => moduleDescriptorIds.find(id => id.startsWith(name)))) {
        found = current.ids;
      }
      return accumulator.concat(found);
    }, []);

    // Remove duplicates
    const idsToAdd = uniq(automaticallyAdded.concat(manuallyAdded || []));
    return moduleDescriptorIds.concat(idsToAdd);
  }

  addModuleDescriptor(moduleDescriptor) {
    return this.okapi.proxy.addModuleDescriptor(moduleDescriptor)
      .then(() => ({ id: moduleDescriptor.id, success: true }))
      .catch(resolveIfOkapiSays('already exists', { id: moduleDescriptor.id, alreadyExists: true }));
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

  listModulesForTenant(tenant) {
    return this.okapi.proxy.getModulesForTenant(tenant)
      .then(response => response.json())
      .then(data => data.map(mod => mod.id));
  }

  listModules() {
    return this.okapi.proxy.getModules()
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

  installModulesForTenant(moduleDescriptorIds, tenant, simulate) {
    const modulePayload = moduleDescriptorIds.map(id => {
      return { id, action: 'enable' };
    });

    const promise = simulate
      ? this.okapi.proxy.simulateInstallModulesForTenant(modulePayload, tenant)
      : this.okapi.proxy.installModulesForTenant(modulePayload, tenant);

    return promise.then(response => response.json());
  }

  simulateInstallModulesForTenant(moduleDescriptorIds, tenant) {
    const modulePayload = moduleDescriptorIds.map(id => {
      return { id, action: 'enable' };
    });
    return this.okapi.proxy.simulateInstallModulesForTenant(modulePayload, tenant)
      .then(response => response.json());
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
