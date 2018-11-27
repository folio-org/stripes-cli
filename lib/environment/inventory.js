// These are candidates for aliases and insertion into stripes.config.js
// Their @folio scope names omit "ui-"
const uiModules = [
  'ui-users',
  'ui-inventory',
  'ui-eholdings',
  'ui-checkin',
  'ui-checkout',
  'ui-circulation',
  'ui-organization',
  'ui-developer',
  'ui-plugin-find-user',
  'ui-requests',
  'ui-search',
  'ui-trivial',
  'ui-vendors',
  'ui-finance',
  'ui-orders',
  'ui-calendar',
  'ui-tags',
  'ui-myprofile',
  'ui-servicepoints',
  'ui-agreements',
  'ui-erm-usage',
  'ui-licenses',
  'ui-data-import'
];

// These modules are candidates for aliases
// They do not need to be inserted into a stripes.config.js
const stripesModules = [
  'stripes-connect',
  'stripes-components',
  'stripes-smart-components',
  'stripes-logger',
  'stripes-form',
  'stripes-core',
  'stripes-util',
];

// Platforms will receive a stripes.config.local configuration
// They are not aliased or added to stripes.config.js
const platforms = [
  'stripes-sample-platform',
  'folio-testing-platform',
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
