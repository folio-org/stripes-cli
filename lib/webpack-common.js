import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import webpack from 'webpack';
import loggerFactory from './cli/logger.js';

const logger = loggerFactory('webpack');

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
      config.resolve.modules.push(path.resolve(import.meta.dirname, path.join('..', 'node_modules')));
      config.resolveLoader.modules.push(path.resolve(import.meta.dirname, path.join('..', 'node_modules')));
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

// Returns the loader entries of the esbuild-loader rule(s) in the given config.
function findEsbuildLoaders(config) {
  return (config.module?.rules || [])
    .flatMap(rule => (Array.isArray(rule?.use) ? rule.use : []))
    .filter(use => typeof use?.loader === 'string' && /esbuild-loader/.test(use.loader));
}

// BigTest interactors (and other test helpers) are written with legacy (TypeScript-style, "experimental") decorators.
// esbuild assumes standard decorators unless told otherwise, which breaks those classes at runtime.
function enableLegacyDecorators(config) {
  findEsbuildLoaders(config).forEach((use) => {
    use.options = {
      ...use.options,
      tsconfigRaw: { compilerOptions: { experimentalDecorators: true } },
    };
  });
};

// test coverage is activated by adding an istanbul instrumentation loader after the transpiler.
// the test stack includes es-build for dev and production, but unfortunately, the tool includes
// no test coverage instrumentation :o( https://github.com/evanw/esbuild/issues/184
function enableCoverage(config) {
  // exclude node_modules (shouldModuleBeIncluded lets @folio modules through so they get transpiled,
  // but they should not be in coverage reports) and test and story files from coverage reports here.
  const excludeRegex = [
    /[\\/]node_modules[\\/]/,
    /\.test\.js$/,
    /[\\/]tests[\\/][^\\/]+\.js$/,
    /[\\/]stories[\\/][^\\/]+\.js$/,
  ];

  config.module.rules.push({
    test: /\.js$/,
    enforce: 'post',
    include: shouldModuleBeIncluded,
    exclude: excludeRegex,
    loader: fileURLToPath(new URL('./istanbul-loader.js', import.meta.url)),
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

export default {
  processError,
  processStats,
  cliResolve,
  cliAliases,
  emitLintWarnings,
  limitChunks,
  enableCoverage,
  enableLegacyDecorators,
  enableMirage,
  ignoreCache,
};
