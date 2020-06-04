const fs = require('fs-extra');
const path = require('path');

async function fetchAndStoreModules() {
  const { Octokit } = require('@octokit/rest');
  const octokit = new Octokit();

  const repos = { apps: [], libs: [], other: [], platforms: [], plugins: [] };
  const options = octokit.repos.listForOrg.endpoint.merge({ org: 'folio-org', type: 'public' });
  const data = await octokit.paginate(options);
  data.forEach(r => {
    if (!r.archived) {
      if (otherModules.indexOf(r.full_name) > -1) {
        repos.other.push(r.name);
      }
      // Platforms will receive a stripes.config.local configuration
      // They are not aliased or added to stripes.config.js
      else if ((r.full_name.startsWith('folio-org/stripes-') && r.full_name.endsWith('-platform')) || (r.full_name.startsWith('folio-org/platform-'))) {
        repos.platforms.push(r.name);
      } else if (r.full_name.startsWith('folio-org/ui-plugin')) {
        repos.plugins.push(r.name);
      }
      // These are candidates for aliases and insertion into stripes.config.js
      // Their @folio scope names omit "ui-"
      else if (r.full_name.startsWith('folio-org/ui-')) {
        repos.apps.push(r.name);
      }
      // These modules are candidates for aliases
      // They do not need to be inserted into a stripes.config.js
      else if (r.full_name.startsWith('folio-org/stripes-')) {
        repos.libs.push(r.name);
      }
    }
  });

  // Save each group in alphabetical order
  for (const section in repos) {
    repos[section].sort();
  }
  saveModules(repos);
}

function saveModules(modules) {
  const outputPath = path.join(__dirname, '/inventory.json');
  fs.outputJSONSync(outputPath, modules);
  console.log(`Saved modules to ${outputPath}`);
}

function readModules() {
  return fs.readJSONSync(path.join(__dirname, '/inventory.json'));
}

const stripesModules = function () {
  const mods = readModules();
  return mods.libs;
};

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
const moduleDescriptorExtras = [
  'stripes-smart-components',
  'stripes-core',
];

// Add the @folio scope, omitting "ui-" prefix if necessary
function toFolioName(theModule) {
  const mods = allModules();
  let moduleName = theModule;
  if (mods.apps.includes(theModule)) {
    moduleName = moduleName.replace(/^ui-/, '');
  }
  return `@folio/${moduleName}`;
}

// Mapping of extra modules based on existence of other modules.
const backendDescriptorExtras = [
  { match: ['folio_search', 'folio_inventory'],
    ids: ['mod-codex-inventory'] },
  { match: ['folio_search', 'folio_eholdings'],
    ids: ['mod-codex-ekb'] }
];

const templates = {
  uiApp: 'https://github.com/folio-org/ui-app-template.git'
};

const allModules = () => {
  return readModules();
};

const allModulesAsFlatArray = () => {
  let ret = [];
  const repos = allModules();
  for (const section in repos) {
    ret = ret.concat(repos[section]);
  }
  return ret;
};

module.exports = {
  stripesModules,
  allModules,
  allModulesAsFlatArray,
  fetchAndStoreModules,
  toFolioName,
  moduleDescriptorExtras,
  backendDescriptorExtras,
  templates,
};
