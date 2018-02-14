const path = require('path');
const resolve = require('resolve');
const generateModuleDescriptor = require('./generate-module-descriptor');

const cliRoot = path.join(__dirname, '..', '..');

// Determine if the currently running CLI is global or locally installed
function isGlobal(dir) {
  try {
    resolve.sync('stripes-cli', { basedir: dir });
    return false;
  } catch (err) {
    return true;
  }
}

function getContext(dir) {
  const workingDir = path.resolve(dir || '');

  const ctx = {
    type: 'unknown',
    moduleName: '',
    isGlobalCli: isGlobal(workingDir),
    isLocalCoreAvailable: false,
    cwd: workingDir,
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
    // TODO: Also check the parent directory?
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
  isGlobal,
};
