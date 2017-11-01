// Loads or generates a stripes tenant configuration based on CLI context

const generatePlatform = require('./generate-platform');

module.exports = function loadConfig(stripesConfigFile, context) {
  let stripesConfig;
  if (stripesConfigFile) {
    stripesConfig = require(path.resolve(stripesConfigFile)); // eslint-disable-line
  } else if (context.type === 'app' && context.moduleName) {
    stripesConfig = generatePlatform(context.moduleName);
  } else {
    throw new Error('Unable to generate a stripes platform configuration');
  }
  return stripesConfig;
};
