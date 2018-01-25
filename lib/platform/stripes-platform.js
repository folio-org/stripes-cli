const path = require('path');
const { defaultConfig, emptyConfig, mergeConfig } = require('./platform-config');
const AliasService = require('./alias-service');
const webpackCommon = require('../webpack-common');

module.exports = class StripesPlatform {
  constructor(stripesConfigFile, context, options) {
    this.aliasService = new AliasService();
    this.isAppContext = context.type === 'app';
    this.aliases = {};

    // Start with stripes.config.js or internal defaults
    this.applyDefaultConfig(stripesConfigFile);

    // Initialize the platform based on context
    if (this.isAppContext) {
      this.applyVirtualAppPlatform(context.moduleName);
    }

    // Applies any previously defined aliases
    this.applyVirtualPlatform();

    // Apply any command options last
    this.applyCommandOptions(options);
  }

  applyDefaultConfig(stripesConfigFile) {
    // TODO: Validate incoming config
    if (stripesConfigFile) {
      const stripesConfig = require(path.resolve(stripesConfigFile)); // eslint-disable-line
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

  // Add stripes ui-developer module
  applyUiDeveloperTools() {
    const modules = { '@folio/developer': {} };
    this.config = mergeConfig(this.config, { modules });
    this.aliases['@folio/developer'] = path.resolve(__dirname, '..', '..', 'node_modules', '@folio', 'developer');
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
      if (validAliases[moduleName].type) {
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
    }
  }

  getWebpackOverrides(isLocalCoreAvailable) {
    const overrides = [];
    const stripesCoreAlias = this.aliases['@folio/stripes-core'];
    overrides.push(webpackCommon.cliResolve(isLocalCoreAvailable, stripesCoreAlias));
    overrides.push(webpackCommon.cliAliases(this.aliases));
    return overrides;
  }

  getStripesConfig() {
    const config = Object.assign({}, this.config);
    delete config.aliases;
    return config;
  }
};
