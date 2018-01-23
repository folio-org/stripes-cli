const fs = require('fs');
const path = require('path');
const { Server, config } = require('karma');

const cwd = path.resolve();

// Runs the specified integration tests
module.exports = function runUnitTests(webpackConfig, karmaOptions) {
  // TODO: Standardize on test folder, 'test' vs 'tests'
  const testIndex = path.join(cwd, 'tests', 'index.js');
  const preprocessors = {};
  preprocessors[`${testIndex}`] = ['webpack'];

  let karmaConfig = {
    frameworks: ['mocha'],
    reporters: ['mocha'],
    port: 9876,

    browsers: ['Chrome'],

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
    ],
  };

  // Apply user supplied --karma options to configuration
  // Added now so they will be available within app-supplied config function
  if (karmaOptions) {
    Object.assign(karmaConfig, karmaOptions);
  }

  // Use Karma's parser to prep the base config
  karmaConfig = config.parseConfig(undefined, karmaConfig);

  // Check for an app-supplied Karma config and apply it
  if (fs.existsSync(path.join(cwd, 'karma.conf.js'))) {
    const appKarmaConfig = require(path.join(cwd, 'karma.conf.js'));  // eslint-disable-line
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
