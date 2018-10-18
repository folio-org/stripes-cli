const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const logger = require('./cli/logger')('webpack');

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
// This adjusts Webpack's resolve configuration to account for the location of stripes-core.
function cliResolve(context) {
  return (config) => {
    if (context.isGlobalYarn) {
      config.resolve.modules.push(context.globalDirs.yarn.packages);
      config.resolveLoader.modules.push(context.globalDirs.yarn.packages);
    } else {
      config.resolve.modules.push(path.resolve(__dirname, path.join('..', 'node_modules')));
      config.resolveLoader.modules.push(path.resolve(__dirname, path.join('..', 'node_modules')));
    }
    logger.log('entry:', config.entry);
    logger.log('resolve.modules:', config.resolve.modules);
    logger.log('resolveLoader.modules:', config.resolveLoader.modules);
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
      logger.log('resolve.alias:', config.resolve.alias);
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

function enableCoverage(config) {
  const babelLoaderConfigIndex = config.module.rules.findIndex((rule) => {
    return rule.loader === 'babel-loader';
  });
  if (!config.module.rules[babelLoaderConfigIndex].options.plugins) {
    config.module.rules[babelLoaderConfigIndex].options.plugins = [];
  }
  config.module.rules[babelLoaderConfigIndex].options.plugins.push(
    require.resolve('babel-plugin-istanbul')
  );
  return config;
}

function enableMirage(scenario) {
  return (config) => {
    const mirageEntry = path.resolve('./test/bigtest/network/boot.js');

    if (fs.existsSync(mirageEntry)) {
      config.plugins.push(new webpack.EnvironmentPlugin({
        MIRAGE_SCENARIO: scenario === true ? 'default' : scenario
      }));

      config.entry.unshift(mirageEntry);
    }

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
  enableCoverage,
  enableMirage,
};
