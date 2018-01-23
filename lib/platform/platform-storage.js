const Configstore = require('configstore');

// TODO: May want to modify storage key if running CLI locally
const storageKey = '@folio/stripes-cli';

const storageDefault = {
  platforms: {},
};

const platformDefault = {
  aliases: {},
};

// Creates and persists a virtual platform for use by the CLI
// Currently this maintains aliases for mapping a virtual platform during build
// TODO: This could also manage stripes.config.js properties like okapi, config, and modules
module.exports = class PlatformStorage {
  constructor(stripesConfig, platformName) {
    this.platformKey = platformName || 'default';
    this.config = new Configstore(storageKey, storageDefault);

    // Initialize platform storage
    if (!this.config.has(`platforms.${this.platformKey}`)) {
      this.config.set(`platforms.${this.platformKey}`, platformDefault);
    }
  }

  aliasKey(moduleName) {
    if (moduleName) {
      return `platforms.${this.platformKey}.aliases.${moduleName}`;
    }
    return `platforms.${this.platformKey}.aliases`;
  }

  addAlias(moduleName, absolutePath) {
    const key = this.aliasKey(moduleName);
    this.config.set(key, absolutePath); // store absolute path
    return true;
  }

  hasAlias(moduleName) {
    const key = this.aliasKey(moduleName);
    return this.config.has(key);
  }

  removeAlias(moduleName) {
    const key = this.aliasKey(moduleName);
    if (this.config.has(key)) {
      this.config.delete(key);
    }
  }

  clearAliases() {
    return this.config.set(this.aliasKey(), {});
  }

  getAllAliases() {
    return this.config.get(this.aliasKey());
  }

  getStoragePath() {
    return this.config.path;
  }
};
