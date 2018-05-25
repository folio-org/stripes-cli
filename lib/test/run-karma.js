const fs = require('fs');
const path = require('path');
const { Server, config } = require('karma');
const logger = require('../cli/logger')('karma');

const cwd = path.resolve();

// Runs the specified integration tests
module.exports = function runKarmaTests(webpackConfig, karmaOptions) {
  // TODO: Standardize on test folder, 'test' vs 'tests'
  const testIndex = path.join(cwd, 'tests', 'index.js');
  const preprocessors = {};
  preprocessors[`${testIndex}`] = ['webpack'];

  let karmaConfig = {
    frameworks: ['mocha'],
    reporters: ['mocha'],
    port: 9876,

    browsers: ['Chrome'],

    customLaunchers: {
      // Custom launcher for CI
      ChromeDocker: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--disable-web-security'
        ]
      }
    },

    junitReporter: {
      outputDir: 'artifacts/runTest',
      useBrowserName: true,
    },

    files: [
      { pattern: testIndex, watched: false },
    ],

    preprocessors,

    webpack: webpackConfig,

    webpackMiddleware: {
      stats: 'errors-only',
    },

    mochaReporter: {
      showDiff: true,
    },

    plugins: [
      'karma-chrome-launcher',
      'karma-mocha',
      'karma-webpack',
      'karma-mocha-reporter',
      'karma-coverage',
      'karma-junit-reporter',
    ],

    coverageReporter: {
      dir: 'artifacts/coverage',
      subdir: '.',
      reporters: [
        { type: 'text' },
        { type: 'lcovonly', file: 'lcov.txt' }
      ],
      includeAllSources: true,
      check: {
        // Thresholds under which karma will return failure
        // Modules are expected to define their own values in karma.conf.js
        global: {},
        each: {},
      }
    },
  };

  if (karmaOptions.coverage) {
    logger.log('Enabling coverage');
    karmaConfig.reporters.push('coverage');
    karmaConfig.plugins.push('karma-coverage');
  }

  if (karmaOptions.reporters && karmaOptions.reporters.includes('junit')) {
    logger.log('Enabling junit reporter');
    karmaConfig.plugins.push('karma-junit-reporter');
  }

  // Apply user supplied --karma options to configuration
  // Added now so they will be available within app-supplied config function
  if (karmaOptions) {
    logger.log('Applying command-line Karma options', karmaOptions);
    Object.assign(karmaConfig, karmaOptions);
  }

  // Use Karma's parser to prep the base config
  karmaConfig = config.parseConfig(undefined, karmaConfig);

  // Check for an app-supplied Karma config and apply it
  const localConfig = path.join(cwd, 'karma.conf.js');
  if (fs.existsSync(localConfig)) {
    const appKarmaConfig = require(localConfig);  // eslint-disable-line
    logger.log('Applying local Karma config', localConfig);
    appKarmaConfig(karmaConfig);

    // Reapply user options so they take precedence
    if (karmaOptions) {
      Object.assign(karmaConfig, karmaOptions);
    }
  }

  const karma = new Server(karmaConfig, (exitCode) => {
    console.log(`Karma exited with ${exitCode}`);
    process.exit(exitCode);
  });
  karma.start();
};
