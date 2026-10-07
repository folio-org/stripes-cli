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
  return config;
}

// Test coverage is activated by running the istanbul instrumentation plugin through babel-loader.
// esbuild does the transpiling but has no instrumentation of its own (https://github.com/evanw/esbuild/issues/184),
// so babel-loader is placed after esbuild-loader in the pipeline (loaders run last-to-first) to instrument its output.
// The input source map supplied by esbuild-loader keeps coverage mapped to the original source.
function enableCoverage(config) {
  const loaders = findEsbuildLoaders(config);
  if (!loaders.length) {
    throw new Error('Unable to enable coverage: no esbuild-loader rule found in the webpack configuration.');
  }

  const instrumenter = {
    loader: require.resolve('babel-loader'),
    options: {
      babelrc: false,
      configFile: false,
      compact: false,
      plugins: [
        // exclude files from coverage reports here.
        [require.resolve('babel-plugin-istanbul'), {
          exclude: [
            '**/*.test.js',
            '**/*-test.js',
            '**/tests/**',
            '**/stories/**',
            '**/node_modules/**',
          ]
        }]
      ],
    },
  };

  config.module.rules.forEach((rule) => {
    if (Array.isArray(rule?.use) && rule.use.some(use => loaders.includes(use))) {
      rule.use = [instrumenter, ...rule.use];
    }
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
  enableLegacyDecorators,
  enableMirage,
  ignoreCache,
};
