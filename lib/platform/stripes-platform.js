const path = require('path');
const { defaultConfig, emptyConfig, mergeConfig } = require('./tenant-config');
const AliasService = require('./alias-service');
const webpackCommon = require('../webpack-common');
const logger = require('../cli/logger')();

module.exports = class StripesPlatform {
  constructor(stripesConfig, context, options) {
    this.aliasService = new AliasService();
    this.isAppContext = context.isUiModule;
    this.aliases = {};
    this.addAliasesAsModules = true;

    // Start with stripes.config.js or internal defaults
    this.applyDefaultConfig(stripesConfig);

    // Initialize the platform based on context
    if (this.isAppContext) {
      this.applyVirtualAppPlatform(context.moduleName);
    }

    // Applies any previously defined aliases
    this.applyVirtualPlatform();

    // Apply any command options last
    this.applyCommandOptions(options);
  }

  applyDefaultConfig(stripesConfig) {
    // TODO: Validate incoming config
    if (stripesConfig) {
      // When modules are specified in a config file, do not automatically apply aliases as modules
      if (stripesConfig.modules) {
        this.addAliasesAsModules = false;
      }
      this.config = mergeConfig(emptyConfig, stripesConfig);
    } else {
      this.config = mergeConfig(emptyConfig, defaultConfig);
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
    this.aliases[moduleName] = path.resolve();
  }

  // Adds previously saved virtual platform aliases to the config
  applyVirtualPlatform() {
    const aliases = this.aliasService.getValidatedAliases();
    this.applyAliasesToPlatform(aliases);
  }

  // Conditionally apply validated aliases to platform
  applyAliasesToPlatform(validAliases) {
    const moduleNames = Object.getOwnPropertyNames(validAliases);
    for (const moduleName of moduleNames) {
      // Only include aliases with a type in the stripes.config modules
      if (this.addAliasesAsModules && validAliases[moduleName].type) {
        this.config.modules[moduleName] = {};
      }
      this.aliases[moduleName] = validAliases[moduleName].path;
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
      if (options.languages) {
        this.config.config.languages = options.languages;
      }
    }
  }

  getWebpackOverrides(context) {
    const overrides = [];
    overrides.push(webpackCommon.cliResolve(context));
    overrides.push(webpackCommon.cliAliases(this.aliases));
    return overrides;
  }

  getStripesConfig() {
    const config = Object.assign({}, this.config);
    delete config.aliases;
    logger.log('using stripes tenant config:', config);
    return config;
  }
};
