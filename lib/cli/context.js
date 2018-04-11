const path = require('path');
const isInstalledGlobally = require('is-installed-globally');
const generateModuleDescriptor = require('./generate-module-descriptor');
// TODO: Yarn 1.5.1 changed global install directory on Windows, 'global-dirs' does not yet reflect this
// https://github.com/yarnpkg/yarn/pull/5336
const globalDirs = require('global-dirs');
const isPathInside = require('is-path-inside');

const cliRoot = path.join(__dirname, '..', '..');

function isGlobalYarn() {
  return isPathInside(__dirname, globalDirs.yarn.packages);
}

function getContext(dir) {
  const workingDir = path.resolve(dir || '');

  const ctx = {
    type: 'unknown',
    moduleName: '',
    isGlobalCli: isInstalledGlobally,
    isGlobalYarn: isGlobalYarn(),
    globalDirs,
    isLocalCoreAvailable: false,
    cwd: workingDir,
    cliRoot,
  };

  let cwdPackageJson;
  try {
    cwdPackageJson = require(`${ctx.cwd}/package.json`); // eslint-disable-line
    ctx.isLocalCoreAvailable = Object.getOwnPropertyNames(cwdPackageJson.dependencies).findIndex(key => key.startsWith('@folio/stripes-core')) > -1;
  } catch (e) {
    // no package.json in the current directory
  }

  // No package.json so assume this is an empty project
  if (!cwdPackageJson) {
    ctx.type = 'empty';
    return ctx;
  }

  // Operating within in the Stripes CLI
  if (ctx.cwd === cliRoot) {
    ctx.type = 'cli';
    return ctx;
  }

  // Package.json with stripes metadata, assume this is an app
  if (cwdPackageJson.stripes) {
    ctx.type = cwdPackageJson.stripes.type;
    ctx.moduleName = cwdPackageJson.name;
    ctx.moduleDescriptor = generateModuleDescriptor(cwdPackageJson);
    return ctx;
  }

  // Package.json contains workspace with a stripes reference, assume this is a stripes workspace
  if (cwdPackageJson.workspaces && cwdPackageJson.workspaces.find(key => key.includes('stripes'))) {
    ctx.type = 'workspace';
    return ctx;
  }

  // Package.json without stripes metadata, but has at least one @folio dependency, assume this is a platform
  if (cwdPackageJson.dependencies &&
    Object.getOwnPropertyNames(cwdPackageJson.dependencies).find(key => key.startsWith('@folio/'))) {
    ctx.type = 'platform';
    ctx.moduleName = cwdPackageJson.name;
    return ctx;
  }

  // Unable to determine context
  return ctx;
}

module.exports = {
  getContext,
};
