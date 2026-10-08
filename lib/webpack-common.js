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
    if (context.isGlobalInstall) {
      config.resolve.modules.push(context.globalPackagesDir);
      config.resolveLoader.modules.push(context.globalPackagesDir);
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

// shouldModuleBeIncluded -
// this is a slimmed-down version of stripes-webpack's shouldModuleBeIncluded. We still need to
// transpile things that need to be transpiled, which is our working project's files and any from an `@folio` scoped module.

function shouldModuleBeIncluded(modulePath) {
  const nodeModulesRegex = /node_modules/;

  // https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex/6969486#6969486
  const escapeRegExp = string => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const folioModulePath = path.join('node_modules', '@folio');
  const folioModulesRegex = new RegExp(`${escapeRegExp(folioModulePath)}(?!.*dist)`);

  if (folioModulesRegex.test(modulePath)) return true;

  // exclude empty modules
  if (!modulePath) return false;

  // skip everything from node_modules
  return !nodeModulesRegex.test(modulePath);
}

// test coverage is activated by adding an istanbul instrumentation loader after the transpiler.
// the test stack includes es-build for dev and production, but unfortunately, the tool includes
// no test coverage instrumentation :o( https://github.com/evanw/esbuild/issues/184

function enableCoverage(config) {
  // exclude test and story files from coverage reports here.
  const excludeRegex = /(\.test\.js|[\\/]tests[\\/][^\\/]+\.js|[\\/]stories[\\/][^\\/]+\.js)$/;

  config.module.rules.push({
    test: /\.js$/,
    enforce: 'post',
    include: shouldModuleBeIncluded,
    exclude: excludeRegex,
    loader: require.resolve('./istanbul-loader'),
  });

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

function ignoreCache(config) {
  return { ...config, cache: false };
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
  ignoreCache,
};
