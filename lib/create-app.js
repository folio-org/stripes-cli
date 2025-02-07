import path from 'path';
import fs from 'fs-extra';
import kebabCase from 'just-kebab-case';
import semver from 'semver';
import pascalCase from 'just-pascal-case';
import simpleGit from 'simple-git';
import { templates } from './environment/inventory.js';


const pkgPath = path.join(import.meta.dirname, '..', 'package.json');
const { version: currentCLIVersion } = fs.readJsonSync(pkgPath, { throws: false });

const COOKIECUTTER_PREFIX = '__';

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

function replaceTemplateValues(oldString, args) {
  let newString = oldString;
  Object.keys(args).forEach(key => {
    const search = `${COOKIECUTTER_PREFIX}${key}${COOKIECUTTER_PREFIX}`;
    const replace = args[key];
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

function renameTemplate(file, args) {
  const from = file;
  const parts = file.split(path.sep);
  parts[parts.length - 1] = replaceTemplateValues(parts[parts.length - 1], args);
  const to = parts.join(path.sep);

  console.info(`${from} -> ${to}`);
  fs.renameSync(from, to);
}

function updateTemplate(file, args) {
  const from = fs.readFileSync(file, 'utf8');
  const to = replaceTemplateValues(removeLintExclusions(from), args);

  if (to !== from) {
    console.info('Updating: ' + file);
    fs.writeFileSync(file, to);
  }
}

async function createApp(appName, appDescription) {
  const args = appDefaults(appName, appDescription);

  try {
    await simpleGit().silent(true).clone(templates.uiApp, args.uiAppName);
    const localTemp = `./${args.uiAppName}`;

    // Remove .git
    fs.removeSync('./.git');

    // Rename dirs
    let results = getFileOrDir(localTemp, true);
    console.info('Renaming template directories: ' + results.length);
    results.forEach(result => renameTemplate(result, args));

    // Get all files and update them
    results = getFileOrDir(localTemp, false, true);
    console.info('Updating template files: ' + results.length);
    results.forEach(result => updateTemplate(result, args));
    console.log('App created successfully');
  } catch (err) {
    console.error('Something went wrong while creating the app.');
    console.info(err);
  }

  return args;
}

export default {
  appDefaults,
  createApp,
};
