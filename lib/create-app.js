const copy = require('kopy');
const path = require('path');
const kebabCase = require('just-kebab-case');
const pascalCase = require('just-pascal-case');
const cliPackageJSON = require('../package.json');

function appDefaults(inputName, inputDescription) {
  let appName = kebabCase(inputName);

  if (appName.startsWith('ui-')) {
    appName = appName.replace('ui-', '');
  }
  const zeroPatchCLIVersion = cliPackageJSON.version.replace(/\d*$/, '0');
  const defaults = {
    appName,
    appDescription: inputDescription || `Description for ${appName}`,
    appDir: `ui-${appName}`,
    uiAppName: `ui-${appName}`,
    packageName: `@folio/${appName}`,
    displayName: inputName,
    appRoute: `/${appName.replace('-', '')}`,
    componentName: pascalCase(appName),
    cliVersion: zeroPatchCLIVersion
  };

  return defaults;
}

function createApp(appName, appDescription) {
  const data = appDefaults(appName, appDescription);
  console.log(JSON.stringify(data, null, 2));
  const templateDir = path.join(__dirname, '..', 'resources/ui-app');
  const appDir = path.resolve(data.appDir);

  return copy(templateDir, appDir, {
    data,
    move: {
      'translations/en.json': `translations/${data.uiAppName}/en.json`,
    },
    clean: false,
  }).then(() => {
    console.log('App created successfully');
    return data;
  }).catch((err) => {
    console.log(err.stack);
  });
}

module.exports = {
  appDefaults,
  createApp,
};
