const path = require('path');
const resolve = require('resolve');

const cwd = path.resolve();
const cliRoot = path.join(__dirname, '..');

// Determine if the currently running CLI is global or locally installed
function isGlobal() {
  try {
    resolve.sync('stripes-cli', { basedir: cwd });
    return false;
  } catch (err) {
    return true;
  }
}

module.exports = function getContext() {
  const ctx = {
    type: 'unknown',
    moduleName: '',
    isGlobalCli: isGlobal(),
  };

  let cwdPackageJson;
  try {
    cwdPackageJson = require(`${cwd}/package.json`); // eslint-disable-line
  } catch (e) {
    // no package.json in the current directory
  }

  // No package.json so assume this is an empty project
  if (!cwdPackageJson) {
    ctx.type = 'empty';
    return ctx;
  }

  // Operating within in the Stripes CLI
  if (cwd === cliRoot) {
    ctx.type = 'cli';
    return ctx;
  }

  // Package.json with stripes metadata, assume this is an app
  if (cwdPackageJson.stripes) {
    ctx.type = cwdPackageJson.stripes.type;
    ctx.moduleName = cwdPackageJson.name;
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
};
