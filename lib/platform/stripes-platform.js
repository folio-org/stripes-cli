const path = require('path');
const PlatformStorage = require('./platform-storage');
const { defaultConfig, emptyConfig, mergeConfig } = require('./platform-config');
const { validateAliases } = require('./alias-validation');


module.exports = class StripesPlatform {
  constructor(stripesConfigFile, context) {
    // TODO: Validate incoming config
    if (stripesConfigFile) {
      const stripesConfig = require(path.resolve(stripesConfigFile)); // eslint-disable-line
      this.config = mergeConfig(emptyConfig, stripesConfig);
      this.override = stripesConfig.override;
    } else {
      this.config = defaultConfig;
    }
    this.isAppContext = context.type === 'app';

    if (this.config.aliases) {
      this.config.aliases = validateAliases(this.config.aliases);
    }
  }

  // Adds self to the create a virtual platform
  applyVirtualAppPlatform(moduleName) {
    if (!this.isAppContext || !moduleName) {
      return;
    }
    const modules = {};
    modules[moduleName] = {};
    this.config = mergeConfig(this.config, { modules });
    this.config.aliases[moduleName] = path.resolve();
  }

  // Adds previously saved virtual platform aliases to the config
  applyVirtualPlatform() {
    const storage = new PlatformStorage();
    const allAliases = storage.getAllAliases();
    const moduleNames = Object.getOwnPropertyNames(allAliases);
    for (const moduleName of moduleNames) {
      this.config.modules[moduleName] = {};
      this.config.aliases[moduleName] = allAliases[moduleName];
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
    delete config.override; // TODO: Consolidate CLI-specific properties under 'cli' to simplify removal
    return config;
  }

  getAliases() {
    return this.config.aliases;
  }

  getOverride(argv) {
    if (this.override && typeof this.override === 'function') {
      return this.override(argv);
    } else {
      return config => config;
    }
  }
};
