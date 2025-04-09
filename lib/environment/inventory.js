import fs from 'fs-extra';
import path from 'path';
import { Octokit } from '@octokit/rest';

const MODULE_CACHE_FILE = '/inventory.json';

// Available for cloning
const otherModules = [
  'folio-org/eslint-config-stripes',
  'folio-org/stripes',
  'folio-org/stripes-cli',
  'folio-org/stripes-testing',
  'folio-org/ui-app-template',
  'folio-org/ui-plugin-example',
];

// Modules not present in a stripes.config, but do need to be included when
// generating module descriptors for a platform
export const moduleDescriptorExtras = [
  'stripes-smart-components',
  'stripes-core',
];

const saveModules = (modules) => {
  const outputPath = path.join(import.meta.dirname, MODULE_CACHE_FILE);
  fs.outputJSONSync(outputPath, modules);
  console.log(`Saved modules to ${outputPath}`);
};

const readModules = () => {
  return fs.readJSONSync(path.join(import.meta.dirname, MODULE_CACHE_FILE));
};

export const fetchAndStoreModules = async () => {
  const octokit = new Octokit();
  const repos = { apps: [], libs: [], other: [], platforms: [], plugins: [] };
  const options = octokit.repos.listForOrg.endpoint.merge({ org: 'folio-org', type: 'public' });
  const data = await octokit.paginate(options);
  data.forEach(r => {
    if (!r.archived) {
      if (otherModules.indexOf(r.full_name) > -1) {
        repos.other.push(r.name);
      } else if ((r.full_name.startsWith('folio-org/stripes-') && r.full_name.endsWith('-platform')) || (r.full_name.startsWith('folio-org/platform-'))) {
        // Platforms will receive a stripes.config.local configuration
        // They are not aliased or added to stripes.config.js
        repos.platforms.push(r.name);
      } else if (r.full_name.startsWith('folio-org/ui-plugin')) {
        repos.plugins.push(r.name);
      } else if (r.full_name.startsWith('folio-org/ui-')) {
        // These are candidates for aliases and insertion into stripes.config.js
        // Their @folio scope names omit "ui-"
        repos.apps.push(r.name);
      } else if (r.full_name.startsWith('folio-org/stripes-')) {
        // These modules are candidates for aliases
        // They do not need to be inserted into a stripes.config.js
        repos.libs.push(r.name);
      }
    }
  });

  // Save each group in alphabetical order
  Object.keys(repos).forEach((section) => {
    repos[section].sort();
  });

  saveModules(repos);
};

export const allModules = () => {
  return readModules();
};

export const stripesModules = () => {
  const mods = readModules();
  return mods.libs;
};

// Add the @folio scope, omitting "ui-" prefix if necessary
export const toFolioName = (theModule) => {
  const mods = allModules();
  let moduleName = theModule;
  if (mods.apps.includes(theModule)) {
    moduleName = moduleName.replace(/^ui-/, '');
  }
  return `@folio/${moduleName}`;
};

// Mapping of extra modules based on existence of other modules.
export const backendDescriptorExtras = [
  { match: ['folio_search', 'folio_inventory'],
    ids: ['mod-codex-inventory'] },
  { match: ['folio_search', 'folio_eholdings'],
    ids: ['mod-codex-ekb'] }
];

export const templates = {
  uiApp: 'https://github.com/folio-org/ui-app-template.git'
};

export const allModulesAsFlatArray = () => {
  let ret = [];
  const repos = allModules();

  Object.keys(repos).forEach((section) => {
    ret = ret.concat(repos[section]);
  });

  return ret;
};

