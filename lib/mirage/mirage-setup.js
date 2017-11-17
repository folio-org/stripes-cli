const path = require('path');
const fs = require('fs');
const webpack = require('webpack');

const cwd = path.resolve();
const miragePath = path.join(cwd, 'mirage');

function validateMirageScenario(scenario) {
  const validScenario = scenario || 'default';
  if (!fs.existsSync(path.join(miragePath, 'scenarios', `${validScenario}.js`))) {
    console.warn(`Unable to find mirage scenario "${validScenario}"`);
    return 'default';
  } else {
    return validScenario;
  }
}

function enableMirage(mirageOption) {
  const mirageEntry = path.join(miragePath, 'boot-mirage.js');
  if (!fs.existsSync(mirageEntry)) {
    console.warn(`Mirage Server not enabled. Unable to find entry "${mirageEntry}"`);
    return config => config;
  }
  console.info('Using Mirage Server');
  return (config) => {
    config.plugins.push(new webpack.EnvironmentPlugin({
      // NODE_ENV: 'development',  TODO: Set this in stripes-core
      MIRAGE_SCENARIO: mirageOption || 'default',
    }));

    return Object.assign({}, config, {
      entry: [mirageEntry].concat(config.entry),
    });
  };
}

module.exports = {
  validateMirageScenario,
  enableMirage,
};
