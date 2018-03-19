const path = require('path');
const resolvePkg = require('resolve-pkg');
// TODO: Yarn 1.5.1 changed global install directory on Windows, 'global-dirs' does not yet reflect this
// https://github.com/yarnpkg/yarn/pull/5336
const globalDirs = require('global-dirs');
const isPathInside = require('is-path-inside');
const resolveFrom = require('resolve-from');
const importLazy = require('import-lazy');
const debug = require('debug')('stripes');
const getStripesWebpackConfig = require('../test/webpack-config');

// Wraps stripes-core modules and API:
// Includes centralized logic to locate stripes-core for build and runtime
module.exports = class StripesCore {
  constructor(aliases) {
    this.cwd = path.resolve();
    this.cliRoot = path.join(__dirname, '..', '..');
    this.coreAlias = aliases['@folio/stripes-core'];
    this.corePath = this.getCorePath();
  }

  get api() {
    if (!this.nodeApi) {
      this.nodeApi = this.getCoreModule('webpack/stripes-node-api');
    }
    return this.nodeApi;
  }

  getCorePath() {
    let found;
    const tryPaths = [
      this.cwd, // check the local project
      path.join(this.cwd, '..'), // and possibly workspace
      this.cliRoot, // cli's dependency
      path.join(this.cliRoot, '..'), // cli in a workspace
    ];

    // Special handling for global Yarn install
    if (isPathInside(__dirname, globalDirs.yarn.packages)) {
      tryPaths.splice(2, 0, globalDirs.yarn.packages);
    }

    // If we have an alias, consider that first
    if (this.coreAlias) {
      found = this.coreAlias;
      debug(`using stripes-core [alias]: ${found}`);
      return found;
    }

    for (let i = 0; i < tryPaths.length; i += 1) {
      found = resolvePkg('@folio/stripes-core', { cwd: tryPaths[i] });
      if (found) { break; }
    }
    if (!found) {
      throw new Error('Unable to locate stripes-core path.', tryPaths);
    }
    debug(`using stripes-core: ${found}`);
    return found;
  }

  getCoreModulePath(moduleId) {
    const coreModulePath = (this.corePath === this.coreAlias)
      ? path.join(this.corePath, moduleId)
      : resolveFrom(this.corePath, `@folio/stripes-core/${moduleId}`);
    return coreModulePath;
  }

  getCoreModule(moduleId) {
    return require(this.getCoreModulePath(moduleId)); // eslint-disable-line global-require, import/no-dynamic-require
  }

  getCoreModuleLazy(moduleId) {
    return importLazy(this.getCoreModulePath(moduleId));
  }

  // TODO: Push this into stripes-core's node-api
  getStripesWebpackConfig(...args) {
    return getStripesWebpackConfig(this, ...args);
  }
};
