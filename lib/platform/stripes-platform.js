const path = require('path');
const PlatformStorage = require('./platform-storage');
const { defaultConfig, emptyConfig, mergeConfig } = require('./platform-config');
const { validateAliases } = require('./alias-validation');
const { aliases } = require('../cli/config');

module.exports = class StripesPlatform {
  constructor(stripesConfigFile, context) {
    // TODO: Validate incoming config
    if (stripesConfigFile) {
      const stripesConfig = require(path.resolve(stripesConfigFile)); // eslint-disable-line
      this.config = mergeConfig(emptyConfig, stripesConfig);
    } else {
      this.config = defaultConfig;
    }
    this.isAppContext = context.type === 'app';
    // Assign aliases defined in .stripesclirc file
    // TODO: Pass this in?
    this.aliases = aliases || {};
  }

  // Adds self to the create a virtual platform
  applyVirtualAppPlatform(moduleName) {
    if (!this.isAppContext || !moduleName) {
      return;
    }
    const modules = {};
    modules[moduleName] = {};
    this.config = mergeConfig(this.config, { modules });
    this.aliases[moduleName] = path.resolve();
  }

  // Add stripes ui-developer module
  applyUiDeveloperTools() {
    const modules = { '@folio/developer': {} };
    this.config = mergeConfig(this.config, { modules });
    this.aliases['@folio/developer'] = path.resolve(__dirname, '..', '..', 'node_modules', '@folio', 'developer');
  }

  // Adds previously saved virtual platform aliases to the config
  applyVirtualPlatform() {
    const storage = new PlatformStorage();
    const allAliases = storage.getAllAliases();
    const moduleNames = Object.getOwnPropertyNames(allAliases);
    for (const moduleName of moduleNames) {
      this.config.modules[moduleName] = {};
      this.aliases[moduleName] = allAliases[moduleName];
    }
  }

  applyCommandOptions(options) {
    if (options) {
      if (options.okapi) {
        this.config.okapi.url = options.okapi;
      }
      if (options.tenant) {
        this.config.okapi.tenant = options.tenant;
      }
      if (options.hasAllPerms) {
        this.config.config.hasAllPerms = true;
      }
    }
  }

  getStripesConfig() {
    const config = Object.assign({}, this.config);
    delete config.aliases;
    return config;
  }

  getAliases() {
    return validateAliases(this.aliases);
  }
};
