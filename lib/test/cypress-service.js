const fs = require('fs');
const path = require('path');
const os = require('os');
const _pickBy = require('lodash/pickBy');

const { defineConfig, run, open } = require('cypress');
const webpack = require('@cypress/webpack-preprocessor');
const logger = require('../cli/logger')('cypress');
const getStripesWebpackConfigStandalone = require('./webpack-config-standalone');

function getTestIndex(cwd, dirs) {
  let file = path.join(cwd, dirs[0], 'index.js');
  let i = 0;

  while (!fs.existsSync(file) && dirs[++i]) {
    file = path.join(cwd, dirs[i], 'index.js');
  }

  return file;
}

function getBaseCypressConfig(fn = (cfg) => cfg, context) {
  const baseConfig = defineConfig({
    browser: 'chrome',
    viewportWidth: 800,
    viewportHeight: 600,
    component: {
      devServer: {
        framework: 'react',
        bundler: 'webpack',
        webpackConfig : getStripesWebpackConfigStandalone()
      },
      specPattern: '**/*[.-]test.js',
      supportFile: path.resolve(__dirname, 'cypress-support.js'),
    },
  });
  return fn(baseConfig, defineConfig);
}

class CypressService {
  constructor(cwd) {
    this.cwd = cwd;
  }

  generateCypressConfig(webpackConfig, cypressOptions) {
    // TODO: Standardize on test folder, `test/bigtest` vs 'test' vs 'tests'
    const testIndex = getTestIndex(this.cwd, ['test/bigtest', 'test', 'tests']);

    // cypress webpack, ignores 'entry' so to keep it from griping, just exclude it.
    const {
      entry, // eslint-disable-line no-unused-vars
      ...webpackConfigRest
    } = webpackConfig;

    const output = {
      // The path defined here is the same as what cypress-webpack is using by default.
      // https://github.com/ryanclark/cypress-webpack/blob/master/lib/webpack/defaults.js#L10

      // We are redefining it here so we can work around a current limitation
      // related to static files (translations) not loading correctly.
      // Please see more comments under:
      // https://github.com/ryanclark/cypress-webpack/issues/498
      // path: path.join(os.tmpdir(), '_cypress_webpack_') + Math.floor(Math.random() * 1000000),
    };

    // set webpack's watch/cache features via cypress config.
    // these features are unnecessary in the CI environment, so we turn them off by default.
    // They can be enabled individually via command-line options '--watch' and '--cache'.
    let webpackTestConfig = {};
    webpackTestConfig.watch = !!cypressOptions?.watch;
    webpackTestConfig.cache = !!cypressOptions?.cache;
    // only apply 'false' options as overrides to what cypress-webpack wants to set.
    webpackTestConfig = _pickBy(webpackTestConfig, (opt) => !opt);

    // let cypressConfig = {
    // frameworks: ['mocha', 'webpack'],
    // reporters: ['mocha'],
    // port: 9876,

    // browsers: ['Chrome'],

    // customLaunchers: {
    //   // Custom launcher for CI
    //   ChromeHeadlessDocker: {
    //     base: 'ChromeHeadless',
    //     flags: [
    //       '--no-sandbox',
    //       '--disable-web-security'
    //     ]
    //   },
    //   ChromeDocker: {
    //     base: 'Chrome',
    //     flags: [
    //       '--no-sandbox',
    //       '--disable-web-security'
    //     ]
    //   }
    // },

    // junitReporter: {
    //   outputDir: 'artifacts/runTest',
    //   useBrowserName: true,
    // },

    // files: [
    //   { pattern: testIndex, watched: false },
    //   // use output.path to work around the issue with loading
    //   // static files
    //   // https://github.com/ryanclark/cypress-webpack/issues/498
    //   {
    //     pattern: `${output.path}/**/*`,
    //     watched: false,
    //     included: false,
    //     served: true,
    //   },
    // ],

    // preprocessors: {
    //   [testIndex]: ['webpack']
    // },

    // webpack: {
    //   ...webpackConfigRest,
    //   ...webpackTestConfig,
    //   output,
    // },
    // webpackMiddleware: {
    //   stats: 'errors-only',
    // },

    // mochaReporter: {
    //   showDiff: true,
    // },

    // plugins: [
    //   'cypress-chrome-launcher',
    //   'cypress-firefox-launcher',
    //   'cypress-mocha',
    //   'cypress-webpack',
    //   'cypress-mocha-reporter',
    // ],

    // coverageIstanbulReporter: {
    //   dir: 'artifacts/coverage',
    //   reports: ['text-summary', 'lcov'],
    //   thresholds: {
    //     // Thresholds under which cypress will return failure
    //     // Modules are expected to define their own values in cypress.conf.js
    //     global: {},
    //     each: {},
    //   }
    // },
    // };

    // Apply user supplied --cypress options to configuration
    // Added now so they will be available within app-supplied config function
    // if (cypressOptions) {
    //   logger.log('Applying command-line Cypress options', cypressOptions);
    //   Object.assign(cypressConfig, cypressOptions);
    // }

    // if (cypressOptions && cypressOptions.coverage) {
    //   logger.log('Enabling coverage');
    //   cypressConfig.reporters.push('coverage-istanbul');
    //   cypressConfig.plugins.push('cypress-coverage-istanbul-reporter');
    // }

    // if (cypressConfig.reporters.includes('junit')) {
    //   logger.log('Enabling junit reporter');
    //   cypressConfig.plugins.push('cypress-junit-reporter');
    // }

    // Use cypress's parser to prep the base config
    let cypressConfig = getBaseCypressConfig();

    // Check for an app-supplied cypress config and apply it
    const localConfig = path.join(this.cwd, 'cypress.config.js');
    if (fs.existsSync(localConfig)) {
      const appCypressConfig = require(localConfig);  // eslint-disable-line
      logger.log('Applying local cypress config', localConfig);
      cypressConfig = appCypressConfig;

      // Reapply user options so they take precedence
      if (cypressOptions) {
        Object.assign(cypressConfig, cypressOptions);
      }
    }
    // console.log(JSON.stringify(cypressConfig, null, 2));
    return cypressConfig;
  }

  // Runs the specified integration tests
  runCypressTests(webpackConfig, cypressOptions) {
    const cypressConfig = this.generateCypressConfig(webpackConfig, cypressOptions);

    try {
      const cyCommand = cypressOptions.open ? open : run;
      cyCommand(cypressConfig)
        .then(res => {
          logger.log('Cypress results:', res);
        })
        .catch(err => {
          logger.log(err.message);
          process.exit(1);
        });
    } catch (e) {
      logger.log('Error running cypress tests:', e);
    }
  }
}

module.exports = {
  getBaseCypressConfig,
  CypressService
};
