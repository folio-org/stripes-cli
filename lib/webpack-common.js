const path = require('path');
const context = require('./cli-context');
const StripesPlatform = require('./stripes-platform');

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
// This adjusts Webpack's entry and resolve configuration to account for the location of stripes-core.
// Stripes-CLI uses its own stripes-core for build logic.  However, we should use the
// locally installed stripes-core for bundled run-time assets.  This is because yarn will have
// de-duped the modules for us.
// TODO: Some refactoring of webpack.config.base (passing in a base path) might eliminate the need to do this.
function cliResolve(config) {
  if (context.isLocalCoreAvailable) {
    // A local stripes-core is available so use its entry point (ideal for production builds)
    // This modification is necessary because the base Webpack config references __dirname
    const entry = config.entry.findIndex(key => key.endsWith('@folio/stripes-core/src/index')); // The CLI's stripes-core entry to replace
    config.entry[entry] = path.join(path.resolve(), 'node_modules/@folio/stripes-core/src/index'); // The platform's own stripes-core entry
  } else {
    // No local stripes-core found, so make the CLI's modules available
    const cliCoreModulePath = path.join(__dirname, '..', 'node_modules');
    config.resolve.modules.push(cliCoreModulePath);
    config.resolveLoader.modules.push(cliCoreModulePath);
  }
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

// Webpack config override:
// Applies platform's aliases to support serving a platform without yarn linking
function cliPlatformAlias(config) {
  const platform = new StripesPlatform();
  const aliases = platform.getAllAliasesSync();
  if (aliases) {
    const moduleNames = Object.getOwnPropertyNames(aliases);
    for (const moduleName of moduleNames) {
      config.resolve.alias[moduleName] = aliases[moduleName];
    }
  }
  return config;
}

module.exports = {
  processError,
  processStats,
  cliResolve,
  cliAppAlias,
  cliPlatformAlias,
};
