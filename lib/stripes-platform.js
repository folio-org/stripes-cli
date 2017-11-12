const path = require('path');
const Configstore = require('configstore');

const storagePrefix = '@folio/stripes-cli';
const cwd = path.resolve();
const aliasKey = moduleName => `aliases.${moduleName}`;

const defaults = {
  aliases: {},
};

// Creates and persists a virtual platform for use by the CLI
// Currently this maintains aliases for mapping a virtual platform during build
// TODO: This could also manage stripes.config.js properties like okapi, config, and modules
module.exports = class StripesPlatform {
  constructor(key) {
    this.config = new Configstore(`${storagePrefix}/platform/${key}`, defaults);
  }

  addAlias(moduleName, relativePath) {
    const key = aliasKey(moduleName);
    return new Promise((resolve, reject) => {
      const packageJsonPath = path.join(cwd, relativePath, '/package.json');
      try {
        require.resolve(packageJsonPath);
      } catch (error) {
        reject(`No package.json found at ${packageJsonPath}`);
      }

      // Validate that this package looks like a Stripes module
      const { name, stripes } = require(packageJsonPath); // eslint-disable-line
      if (name !== moduleName) {
        reject(`Found module ${name}, but was expecting ${moduleName}`);
      } else if (!stripes) {
        reject('Module does not contain a stripes configuration');
      } else {
        this.config.set(key, relativePath); // TODO: store the absolute path?
        resolve();
      }
    });
  }

  removeAlias(moduleName) {
    const key = aliasKey(moduleName);
    return new Promise((resolve, reject) => {
      if (this.config.has(key)) {
        this.config.delete(key);
        resolve();
      } else {
        reject(`Platform does not contain module ${moduleName}`);
      }
    });
  }

  clearAliases() {
    return new Promise((resolve, reject) => {
      this.config.set('aliases', {});
      resolve();
    });
  }

  getAllAliases() {
    return new Promise((resolve, reject) => {
      const allModules = this.config.get('aliases');
      resolve(allModules);
    });
  }
};
