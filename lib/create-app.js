const path = require('path');
const fs = require('fs-extra');
const kebabCase = require('just-kebab-case');
const semver = require('semver');
const pascalCase = require('just-pascal-case');
const simpleGit = require('simple-git/promise');
const { version: currentCLIVersion, uiTemplateRepository } = require('../package.json');

const COOKIECUTTER_PREFIX = '__';
let ARGS = {};

function appDefaults(inputName, inputDescription) {
  let appName = kebabCase(inputName);

  const { version: normilizedCLIVirsion } = semver.coerce(currentCLIVersion);
  const zeroPatchCLIVersion = normilizedCLIVirsion.replace(/\d*$/, '0');

  if (appName.startsWith('ui-')) {
    appName = appName.replace('ui-', '');
  }

  const defaults = {
    appName,
    packageName: appName,
    appDescription: inputDescription || `Description for ${appName}`,
    appDir: `ui-${appName}`,
    uiAppName: `ui-${appName}`,
    displayName: inputName,
    appRoute: `${appName.replace('-', '')}`,
    componentName: pascalCase(appName),
    cliVersion: zeroPatchCLIVersion
  };

  return defaults;
}

function replaceTemplateValues(oldString) {
  let newString = oldString;
  Object.keys(ARGS).forEach(key => {
    const search = `${COOKIECUTTER_PREFIX}${key}${COOKIECUTTER_PREFIX}`;
    const replace = ARGS[key];
    newString = newString.replace(new RegExp(search, 'g'), replace);
  });
  return newString;
}

function removeLintExclusions(oldString) {
  const search = /\/\*\s*eslint-disable.*\*\//;
  const replace = '';
  const newString = oldString.replace(new RegExp(search, 'g'), replace);
  return newString;
}

function getFileOrDir(root, directories, all) {
  let results = [];
  fs.readdirSync(root).forEach(file => {
    const dir = `${root}/${file}`;
    const stat = fs.statSync(dir);
    if (stat.isDirectory() === directories) {
      if (all || file.indexOf(COOKIECUTTER_PREFIX) > -1) {
        results.push(dir);
      }
    }
    if (stat.isDirectory()) {
      results = results.concat(getFileOrDir(dir, directories, all));
    }
  });
  return results.sort((a, b) => b.length - a.length);
}

function renameTemplate(file) {
  const from = file;
  const parts = file.split(path.sep);
  parts[parts.length - 1] = replaceTemplateValues(parts[parts.length - 1]);
  const to = parts.join(path.sep);

  console.info(`${from} -> ${to}`);
  fs.renameSync(from, to);
}

function updateTemplate(file) {
  const from = fs.readFileSync(file, 'utf8');
  const to = replaceTemplateValues(removeLintExclusions(from));

  if (to !== from) {
    console.info('Updating: ' + file);
    fs.writeFileSync(file, to);
  }
}

async function createApp(appName, appDescription) {
  ARGS = appDefaults(appName, appDescription);

  try {
    await simpleGit().silent(true).clone(uiTemplateRepository, ARGS.uiAppName);
    const localTemp = `./${ARGS.uiAppName}`;

    // Remove .git
    fs.removeSync('./.git');

    // Rename dirs
    let results = getFileOrDir(localTemp, true);
    console.info('Renaming template directories: ' + results.length);
    results.forEach(result => renameTemplate(result));

    // Get all files and update them
    results = getFileOrDir(localTemp, false, true);
    console.info('Updating template files: ' + results.length);
    results.forEach(result => updateTemplate(result));
    console.log('App created successfully');
  } catch (err) {
    console.log(err.stack);
  }

  return ARGS;
}

module.exports = {
  appDefaults,
  createApp,
};
