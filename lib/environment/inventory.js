// TODO: Source from Github
const uiModules = [
  'ui-users',
  'ui-inventory',
  'ui-eholdings',
  'ui-checkin',
  'ui-checkout',
  'ui-circulation',
  'ui-organization',
  'ui-developer',
  'ui-plugin-example',
  'ui-plugin-find-user',
  'ui-requests',
  'ui-search',
  'ui-testing',
  'ui-trivial',
  'ui-items',
];

const stripesModules = [
  'stripes-connect',
  'stripes-components',
  'stripes-smart-components',
  'stripes-react-hotkeys',
  'stripes-logger',
  'stripes-form',
  'stripes-core',
];

const platforms = [
  'stripes-sample-platform',
  'folio-testing-platform',
];

const other = [
  'eslint-config-stripes',
];

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
  allModules: uiModules.concat(stripesModules, platforms, other),
  toFolioName,
};
