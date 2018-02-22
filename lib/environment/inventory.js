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

const stripes = [
  'stripes-connect',
  'stripes-components',
  'stripes-smart-components',
  'stripes-react-hotkeys',
  'stripes-logger',
  'stripes-form',
  'stripes-core',
  'eslint-config-stripes',
];

const platforms = [
  'stripes-sample-platform',
  'folio-testing-platform',
];

module.exports = {
  uiModules,
  stripes,
  platforms,
  availableModules: uiModules.concat(stripes, platforms),
};
