const path = require('path');
const webpack = require('webpack');

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
function cliResolve(context) {
  return (config) => {
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
  };
}

// Webpack config override:
// Alias support for serving from within app's own directory
// or serving an entire platform without yarn linking
function cliAliases(aliases) {
  return (config) => {
    if (aliases) {
      const moduleNames = Object.getOwnPropertyNames(aliases);
      for (const moduleName of moduleNames) {
        config.resolve.alias[moduleName] = aliases[moduleName];
      }
    }
    return config;
  };
}

// Show eslint failures at runtime
function emitLintWarnings(config) {
  config.module.rules.push({
    enforce: 'pre',
    test: /\.js$/,
    exclude: /node_modules/,
    loader: 'eslint-loader',
    options: {
      emitWarning: true,
    },
  });
  return config;
}

// Controls the webpack chunk output
function limitChunks(maxChunks) {
  return (config) => {
    config.plugins.push(new webpack.optimize.LimitChunkCountPlugin({
      maxChunks,
    }));
    return config;
  };
}

module.exports = {
  processError,
  processStats,
  cliResolve,
  cliAliases,
  emitLintWarnings,
  limitChunks,
};
