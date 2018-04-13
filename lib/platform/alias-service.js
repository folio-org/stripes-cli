const path = require('path');
const fs = require('fs');
const PlatformStorage = require('./platform-storage');
const cliConfig = require('../cli/config');
const AliasError = require('./alias-error');
const logger = require('../cli/logger')();

const cwd = path.resolve();

// Manages parsing and validation logic for aliases
module.exports = class AliasService {
  constructor(platformStorage) {
    // Cheap way to mock require later on
    this.require = require;
    // Aliases stored with "alias add" command
    this.storage = platformStorage || new PlatformStorage();
    this.storageAliases = this.storage.getAllAliases();

    // Aliases stored with ".stripesclirc" file
    this.configAliases = AliasService.normalizeConfigAliases(cliConfig.aliases, cliConfig.configPath);
  }

  static normalizeConfigAliases(configAliases, configPath) {
    const aliases = Object.assign({}, configAliases);

    if (configPath) {
      const relativeBase = path.relative(cwd, path.parse(configPath).dir);
      const moduleNames = Object.getOwnPropertyNames(aliases);
      for (const moduleName of moduleNames) {
        aliases[moduleName] = path.join(relativeBase, aliases[moduleName]);
      }
    }
    return aliases;
  }

  addAlias(moduleName, relativePath) {
    const absolutePath = this.validateAlias(moduleName, relativePath).path;
    return this.storage.addAlias(moduleName, absolutePath);
  }

  removeAlias(moduleName) {
    if (this.storage.hasAlias(moduleName)) {
      this.storage.removeAlias(moduleName);
      return true;
    } else {
      return false;
    }
  }

  clearAliases() {
    return this.storage.clearAliases();
  }

  getValidatedAliases() {
    const allAliases = Object.assign({}, this.configAliases, this.storageAliases);
    return this.validateAliases(allAliases);
  }

  getValidatedConfigAliases() {
    return this.validateAliases(this.configAliases);
  }

  // Does not throw validation errors (for status data)
  getConfigAliases() {
    return this.validateAliases(this.configAliases, true);
  }

  // Does not throw validation errors (for status data)
  getStorageAliases() {
    return this.validateAliases(this.storageAliases, true);
  }

  validateAliases(originalAliases, parseOnly) {
    logger.log('validating aliases...');
    const aliases = {};
    const moduleNames = Object.getOwnPropertyNames(originalAliases);
    for (const moduleName of moduleNames) {
      aliases[moduleName] = this.validateAlias(moduleName, originalAliases[moduleName], parseOnly);
    }
    return aliases;
  }

  // Validates a relative path alias and returns the absolute path
  validateAlias(moduleName, modulePath, parseOnly) {
    const absolutePath = path.isAbsolute(modulePath) ? modulePath : path.join(cwd, modulePath);
    const packageJsonPath = path.join(absolutePath, 'package.json');
    let validationError = false;
    let stripesType;
    let hasNodeModules;

    try {
      this.require.resolve(packageJsonPath);
    } catch (error) {
      validationError = new AliasError(`No package.json found at ${packageJsonPath}`);
    }

    if (!validationError) {
      // Validate that this package looks like a Stripes module
      const { name, stripes } = this.require(packageJsonPath); // eslint-disable-line
      if (name !== moduleName) {
        validationError = new AliasError(`Found module ${name}, but was expecting ${moduleName}`);
      } else if (stripes) {
        // Type is used later to determine which aliases need to be included in the modules section of a generated stripes.config
        stripesType = stripes.type;
      }

      hasNodeModules = fs.existsSync(packageJsonPath.replace('package.json', 'node_modules'));
    }

    if (validationError && !parseOnly) {
      throw validationError;
    }

    return {
      path: absolutePath,
      type: stripesType,
      isValid: !validationError,
      hasNodeModules,
    };
  }
};
