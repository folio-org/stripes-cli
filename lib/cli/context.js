const path = require('path');
const fs = require('fs');
const importLazy = require('import-lazy')(require);
const isInstalledGlobally = require('is-installed-globally');
const isPathInside = require('is-path-inside');
const logger = require('./logger')();
// TODO: Yarn 1.5.1 changed global install directory on Windows, 'global-dirs' does not yet reflect this
// https://github.com/yarnpkg/yarn/pull/5336
const globalDirs = require('./global-dirs');
const { stripesModules, toFolioName } = require('../environment/inventory');

const xmlParser = importLazy('fast-xml-parser');

const cliRoot = path.join(__dirname, '..', '..');

const context = {
  require, // add require to make it possible to mock it in the tests
};

function isGlobalYarn() {
  return isPathInside(__dirname, globalDirs.yarn.packages);
}

function isUiModule(type) {
  return ['app', 'settings'].some(val => val === type);
}

function isStripesModule(name) {
  return stripesModules.some(val => toFolioName(val) === name);
}

function loadXml(filePath) {
  let xml;
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    xml = xmlParser.parse(data);
  } catch (err) {
    console.log(err);
  }
  return xml;
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
    isUiModule: false,
    isStripesModule: false,
    isPlatform: false,
    isBackendModule: false,
  };

  let cwdPackageJson;
  let cwdPomXml;
  try {
    cwdPackageJson = context.require(`${ctx.cwd}/package.json`); // eslint-disable-line
    ctx.isLocalCoreAvailable = Object.getOwnPropertyNames(cwdPackageJson.dependencies).findIndex(key => key.startsWith('@folio/stripes-core')) > -1;
  } catch (e) {
    // no package.json in the current directory
  }

  // No package.json?  Let's see if this is a back-end module.
  const pomPath = path.resolve('pom.xml');
  if (!cwdPackageJson && fs.existsSync(pomPath)) {
    cwdPomXml = loadXml(pomPath);
    ctx.type = 'mod';
    ctx.isBackendModule = true;
    ctx.moduleName = cwdPomXml.project.artifactId;
    return ctx;
  }

  // No package.json so assume this is an empty project
  if (!cwdPackageJson && !cwdPomXml) {
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
    ctx.isStripesModule = isStripesModule(cwdPackageJson.name);
    ctx.isUiModule = isUiModule(ctx.type);
    return ctx;
  }

  // Package.json contains workspace with a stripes reference, assume this is a stripes workspace
  if (cwdPackageJson.workspaces) {
    ctx.type = 'workspace';
    return ctx;
  }

  // Package.json without stripes metadata, but has at least one @folio dependency, assume this is a platform
  if (cwdPackageJson.dependencies &&
    Object.getOwnPropertyNames(cwdPackageJson.dependencies).find(key => key.startsWith('@folio/'))) {
    ctx.type = 'platform';
    ctx.isPlatform = true;
    ctx.moduleName = cwdPackageJson.name;
    return ctx;
  }

  // Unable to determine context
  return ctx;
}

context.getContext = (...args) => {
  logger.log('loading context...');
  const resultContext = getContext(...args);
  logger.log(`context type: ${resultContext.type}; cwd: ${resultContext.cwd}`);
  return resultContext;
};

module.exports = context;
