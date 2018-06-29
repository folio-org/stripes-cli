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
];

// These modules are candidates for aliases
// They do not need to be inserted into a stripes.config.js
const stripesModules = [
  'stripes-connect',
  'stripes-components',
  'stripes-smart-components',
  'stripes-react-hotkeys',
  'stripes-logger',
  'stripes-form',
  'stripes-core',
];

// Platforms will receive a stripes.config.local configuration
// They are not aliased or added to stripes.config.js
const platforms = [
  'stripes-sample-platform',
  'folio-testing-platform',
];

// Available for cloning
const otherModules = [
  'eslint-config-stripes',
  'ui-plugin-example',
  'ui-testing',
  'stripes-cli',
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

module.exports = {
  uiModules,
  stripesModules,
  platforms,
  otherModules,
  allModules: uiModules.concat(stripesModules, platforms, otherModules),
  toFolioName,
  moduleDescriptorExtras,
};
