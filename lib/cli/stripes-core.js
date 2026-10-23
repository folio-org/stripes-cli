import path from 'path';
import resolvePkg from 'resolve-pkg';
import resolveFrom from 'resolve-from';
import { createRequire } from 'node:module';
import loggerFactory from './logger.js';
import getStripesWebpackConfig from '../test/webpack-config.js';

const logger = loggerFactory();

// stripes-webpack is located at runtime and loaded synchronously
const requireCjs = createRequire(import.meta.url);

// Wraps stripes-core modules and API:
// Includes centralized logic to locate stripes-core for build and runtime
export default class StripesCore {
  constructor(context, aliases) {
    this.context = context;
    this.coreAlias = aliases['@folio/stripes-webpack'];
    this.corePath = this.getCorePath();
  }

  get api() {
    if (!this.nodeApi) {
      this.nodeApi = this.getCoreModule('webpack/stripes-node-api');
      // Augment the API with these dependencies used to create module descriptors
      // These assignments can be removed once stripes-core includes them within the API
      this.nodeApi.StripesModuleParser = this.getCoreModule('webpack/stripes-module-parser').StripesModuleParser;
      this.nodeApi.StripesBuildError = this.getCoreModule('webpack/stripes-build-error');
    }
    return this.nodeApi;
  }

  getCorePath() {
    let found;
    const tryPaths = [
      this.context.cwd, // check the local project
      path.join(this.context.cwd, '..'), // and possibly workspace
      this.context.cliRoot, // cli's dependency
      path.join(this.context.cliRoot, '..'), // cli in a workspace
    ];

    // Special handling for a global install (yarn or npm)
    if (this.context.isGlobalInstall) {
      tryPaths.splice(2, 0, this.context.globalPackagesDir);
    }

    // If we have an alias, consider that first
    if (this.coreAlias) {
      found = this.coreAlias;
      logger.log(`using stripes-webpack [alias]: ${found}`);
      return found;
    }

    for (let i = 0; i < tryPaths.length; i += 1) {
      found = resolvePkg('@folio/stripes-webpack', { cwd: tryPaths[i] });
      if (found) { break; }
    }
    if (!found) {
      throw new Error('Unable to locate stripes-webpack path.', tryPaths);
    }
    logger.log(`using stripes-webpack: ${found}`);
    return found;
  }

  getCoreModulePath(moduleId) {
    const coreModulePath = (this.corePath.includes('node_modules'))
      ? resolveFrom(this.corePath, `@folio/stripes-webpack/${moduleId}`)
      : path.join(this.corePath, moduleId);
    return coreModulePath;
  }

  getCoreModule(moduleId) {
    return requireCjs(this.getCoreModulePath(moduleId));
  }

  // TODO: Push this into stripes-core's node-api
  getStripesWebpackConfig(...args) {
    return getStripesWebpackConfig(this, ...args);
  }
}
