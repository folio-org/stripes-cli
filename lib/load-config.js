// Loads or generates a stripes tenant configuration based on CLI context
const path = require('path');
const generatePlatform = require('./generate-platform');

module.exports = function loadConfig(stripesConfigFile, context, options) {
  let stripesConfig;
  if (stripesConfigFile) {
    stripesConfig = require(path.resolve(stripesConfigFile)); // eslint-disable-line
  } else if (context.type === 'app' && context.moduleName) {
    stripesConfig = generatePlatform(context.moduleName, options);
  } else {
    throw new Error('Unable to generate a stripes platform configuration');
  }
  return stripesConfig;
};
