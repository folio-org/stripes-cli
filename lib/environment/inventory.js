// These are candidates for aliases and insertion into stripes.config.js
// Their @folio scope names omit "ui-"
const uiModules = [
  'ui-acquisition-units',
  'ui-agreements',
  'ui-calendar',
  'ui-checkin',
  'ui-checkout',
  'ui-circulation',
  'ui-data-import',
  'ui-data-export',
  'ui-developer',
  'ui-eholdings',
  'ui-erm-usage',
  'ui-finance',
  'ui-finc-config',
  'ui-finc-select',
  'ui-inventory',
  'ui-invoice',
  'ui-licenses',
  'ui-local-kb-admin',
  'ui-marccat',
  'ui-myprofile',
  'ui-notes',
  'ui-orders',
  'ui-organizations',
  'ui-plugin-find-agreement',
  'ui-plugin-find-contact',
  'ui-plugin-find-erm-usage-data-provider',
  'ui-plugin-find-instance',
  'ui-plugin-find-interface',
  'ui-plugin-find-license',
  'ui-plugin-find-organization',
  'ui-plugin-find-po-line',
  'ui-plugin-find-user',
  'ui-receiving',
  'ui-requests',
  'ui-search',
  'ui-servicepoints',
  'ui-tags',
  'ui-tenant-settings',
  'ui-users',
  'ui-vendors',
];

// These modules are candidates for aliases
// They do not need to be inserted into a stripes.config.js
const stripesModules = [
  'stripes-components',
  'stripes-connect',
  'stripes-core',
  'stripes-erm-components',
  'stripes-final-form',
  'stripes-form',
  'stripes-logger',
  'stripes-smart-components',
  'stripes-util',
];

// Platforms will receive a stripes.config.local configuration
// They are not aliased or added to stripes.config.js
const platforms = [
  'stripes-sample-platform',
  'platform-core',
  'platform-complete',
  'platform-erm',
];

// Available for cloning
const otherModules = [
  'eslint-config-stripes',
  'ui-plugin-example',
  'stripes-cli',
  'stripes-testing',
  'stripes',
];

// Modules not present in a stripes.config, but do need to be included when
// generating module descriptors for a platform
const moduleDescriptorExtras = [
  'stripes-smart-components',
  'stripes-core',
];

// Add the @folio scope, omitting "ui-" prefix if necessary
function toFolioName(theModule) {
  let moduleName = theModule;
  if (uiModules.includes(theModule)) {
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

module.exports = {
  uiModules,
  stripesModules,
  platforms,
  otherModules,
  allModules: uiModules.concat(stripesModules, platforms, otherModules),
  toFolioName,
  moduleDescriptorExtras,
  backendDescriptorExtras,
  templates,
};
