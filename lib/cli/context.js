import path from 'path';
import fs from 'fs';
import isInstalledGlobally from 'is-installed-globally';
import isPathInside from 'is-path-inside';
import { XMLParser } from 'fast-xml-parser';
import loggerFactory from './logger.js';
import globalDirs from './global-dirs.js';
import inventoryMod from '../environment/inventory.js';

const logger = loggerFactory();
const { stripesModules, toFolioName } = inventoryMod;

// TODO: Yarn 1.5.1 changed global install directory on Windows, 'global-dirs' does not yet reflect this
// https://github.com/yarnpkg/yarn/pull/5336



const cliRoot = path.join(import.meta.dirname, '..', '..');

const context = {
  readJson: file => JSON.parse(fs.readFileSync(file, 'utf-8')), // exposed to make it possible to mock it in the tests
};

function getGlobalPackagesDir() {
  if (isPathInside(import.meta.dirname, globalDirs.yarn.packages)) return globalDirs.yarn.packages;
  if (isPathInside(import.meta.dirname, globalDirs.npm.packages)) return globalDirs.npm.packages;
  return undefined;
}

function isUiModule(actsAs) {
  const uiModuleTypes = ['app', 'settings', 'plugin', 'handler'];

  // Backwards compatibility for modules using the `type` string property instead
  // of the new `actsAs` array.
  const types = Array.isArray(actsAs) ? actsAs : [actsAs];

  return types.some(type => uiModuleTypes.find(uiModuleType => uiModuleType === type) !== undefined);
}

function isStripesModule(name) {
  return stripesModules().some(val => toFolioName(val) === name);
}

function loadXml(filePath) {
  let xml;
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    xml = (new XMLParser()).parse(data);
  } catch (err) {
    console.error('Something went wrong reading or parsing the XML file.');
    console.log(err);
  }
  return xml;
}

function getContext(dir) {
  const workingDir = path.resolve(dir || '');
  const globalPackagesDir = getGlobalPackagesDir();

  const ctx = {
    type: 'unknown',
    moduleName: '',
    isGlobalCli: isInstalledGlobally,
    isGlobalInstall: Boolean(globalPackagesDir),
    globalPackagesDir,
    globalDirs,
    isLocalCoreAvailable: false,
    cwd: workingDir,
    cliRoot,
    isEmpty: false,
    isUiModule: false,
    isStripesModule: false,
    isPlatform: false,
    isBackendModule: false,
    isWorkspace: false,
  };

  let cwdPackageJson;
  let cwdPomXml;
  try {
    cwdPackageJson = context.readJson(`${ctx.cwd}/package.json`);
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
    ctx.isEmpty = true;
    return ctx;
  }

  // Operating within in the Stripes CLI
  if (ctx.cwd === cliRoot) {
    ctx.type = 'cli';
    ctx.isCli = true;
    return ctx;
  }

  // Package.json with stripes metadata, assume this is an app
  if (cwdPackageJson.stripes) {
    ctx.actsAs = cwdPackageJson.stripes.actsAs;
    ctx.type = cwdPackageJson.stripes.type;
    ctx.moduleName = cwdPackageJson.name;
    ctx.isStripesModule = isStripesModule(cwdPackageJson.name);
    ctx.isUiModule = isUiModule(ctx.actsAs || ctx.type);
    return ctx;
  }

  // Package.json contains workspace with a stripes reference, assume this is a stripes workspace
  if (cwdPackageJson.workspaces) {
    ctx.type = 'workspace';
    ctx.isWorkspace = true;
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

export default context;
