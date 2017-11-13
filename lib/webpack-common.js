const path = require('path');
const context = require('./cli-context');

// Display error to the console and exit
function processError(err) {
  if (err) {
    console.error(err);
  }
  process.exit(1);
}

// Display webpack output to the console
function processStats(stats) {
  console.log(stats.toString({
    chunks: false,
    colors: true,
  }));
  // Check for webpack compile errors and exit
  if (stats.hasErrors()) {
    processError();
  }
}

// Webpack config override:
// Include CLI's own stripes-core/node_modules for module resolution
// TODO: Confirm - This may only be needed when running the CLI globally
function cliResolve(config) {
  const cliCoreModulePath = path.join(__dirname, '..', 'node_modules');
  config.resolve.modules.push(cliCoreModulePath);
  config.resolveLoader.modules.push(cliCoreModulePath);
  return config;
}

// Webpack config override:
// Alias to support serving from within app's own directory without linking
function cliAppAlias(config) {
  const cwd = path.resolve();
  if (context.moduleName && context.moduleName !== '') {
    config.resolve.alias[context.moduleName] = cwd;
  }
  return config;
}

module.exports = {
  processError,
  processStats,
  cliResolve,
  cliAppAlias,
};
