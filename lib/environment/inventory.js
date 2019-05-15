// These are candidates for aliases and insertion into stripes.config.js
// Their @folio scope names omit "ui-"
const uiModules = [
  'ui-agreements',
  'ui-calendar',
  'ui-checkin',
  'ui-checkout',
  'ui-circulation',
  'ui-data-import',
  'ui-developer',
  'ui-eholdings',
  'ui-erm-usage',
  'ui-finance',
  'ui-inventory',
  'ui-licenses',
  'ui-myprofile',
  'ui-orders',
  'ui-organization',
  'ui-plugin-find-agreement',
  'ui-plugin-find-license',
  'ui-plugin-find-user',
  'ui-requests',
  'ui-search',
  'ui-servicepoints',
  'ui-tags',
  'ui-tenant-settings',
  'ui-trivial',
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

module.exports = {
  uiModules,
  stripesModules,
  platforms,
  otherModules,
  allModules: uiModules.concat(stripesModules, platforms, otherModules),
  toFolioName,
  moduleDescriptorExtras,
  backendDescriptorExtras,
};
