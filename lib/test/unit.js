const fs = require('fs');
const path = require('path');
const Karma = require('karma').Server;

const cwd = path.resolve();

// Runs the specified integration tests
module.exports = function runUnitTests(webpackConfig, karmaOptions) {
  // TODO: Standardize on test folder, 'test' vs 'tests'
  const testIndex = path.join(cwd, 'tests', 'index.js');
  const preprocessors = {};
  preprocessors[`${testIndex}`] = ['webpack'];

  const karmaConfig = {
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
    ],
  };

  if (fs.existsSync(path.join(cwd, 'karma.conf.js'))) {
    karmaConfig.configFile = path.join(cwd, 'karma.conf.js');
  }

  // Apply user supplied --karma options to configuration
  if (karmaOptions) {
    Object.assign(karmaConfig, karmaOptions);
  }

  const karma = new Karma(karmaConfig, (exitCode) => {
    console.log(`Karma exited with ${exitCode}`);
  });
  karma.start();
};
