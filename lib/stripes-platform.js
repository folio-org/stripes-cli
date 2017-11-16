const path = require('path');
const PlatformStorage = require('./platform-storage');

const cwd = path.resolve();
const defaultConfig = {
  okapi: {
    url: 'http://localhost:9130',
    tenant: 'diku',
  },
  config: {
    logCategories: 'core,path,action,xhr',
    logPrefix: '--',
    showPerms: false,
    hasAllPerms: false,
  },
  modules: {
  },
  aliases: {
  },
};

// Merge two stripes configurations
// Replace with deep merge?
function mergeStripesConfig(base, extend) {
  return {
    okapi: Object.assign({}, base.okapi, extend.okapi),
    config: Object.assign({}, base.config, extend.config),
    modules: Object.assign({}, base.modules, extend.modules),
    aliases: Object.assign({}, base.aliases, extend.aliases),
  };
}

// TODO: Consolidate with same alias logic found in platform-storage
// Validates a relative path alias and returns the absolute path
function validateAlias(moduleName, relativePath) {
  const packageJsonPath = path.join(cwd, relativePath, '/package.json');
  try {
    require.resolve(packageJsonPath);
  } catch (error) {
    throw new Error(`No package.json found at ${packageJsonPath}`);
  }
  // Validate that this package looks like a Stripes module
  const { name, stripes } = require(packageJsonPath); // eslint-disable-line
  if (name !== moduleName) {
    throw new Error(`Found module ${name}, but was expecting ${moduleName}`);
  } else if (!stripes) {
    throw new Error('Module does not contain a stripes configuration');
  }

  return path.join(cwd, relativePath); // Absolute path
}

function validateAliases(originalAliases) {
  const aliases = {};
  const moduleNames = Object.getOwnPropertyNames(originalAliases);
  for (const moduleName of moduleNames) {
    aliases[moduleName] = validateAlias(moduleName, originalAliases[moduleName]);
  }
  return aliases;
}


module.exports = class StripesPlatform {
  constructor(stripesConfigFile, context) {
    // TODO: Validate incoming config
    if (stripesConfigFile) {
      const stripesConfig = require(path.resolve(stripesConfigFile)); // eslint-disable-line
      this.config = mergeStripesConfig(defaultConfig, stripesConfig);
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
    this.config = mergeStripesConfig(this.config, { modules });
    this.config.aliases[moduleName] = cwd;
  }

  // Adds previously saved virtual platform aliases to the config
  applyVirtualPlatform() {
    const storage = new PlatformStorage();
    const allAliases = storage.getAllAliasesSync();
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
    return config;
  }

  getAliases() {
    return this.config.aliases;
  }
};
