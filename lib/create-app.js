const copy = require('kopy');
const path = require('path');
const kebabCase = require('lodash.kebabcase');
const startCase = require('lodash.startcase');

function appDefaults(inputName) {
  let appName = kebabCase(inputName);

  if (appName.startsWith('ui-')) {
    appName = appName.replace('ui-', '');
  }

  // TODO: More robust parsing needed
  const defaults = {
    appDir: appName,
    uiAppName: `ui-${appName}`,
    packageName: `@folio/${appName}`,
    displayName: inputName,
    appRoute: `/${appName.replace('-', '')}`,
    componentName: startCase(appName).replace(' ', ''),
  };

  return defaults;
}

module.exports = function createApp(appName) {
  const data = appDefaults(appName);
  console.log(data);
  const templateDir = path.join(__dirname, '..', 'resources/ui-app');
  const appDir = path.resolve(data.appDir);

  return copy(templateDir, appDir, { data, clean: false }).then(({ files }) => {
    // console.log(files);
    console.log('App created successfully');
  }).catch((err) => {
    console.log(err.stack);
  });
};
