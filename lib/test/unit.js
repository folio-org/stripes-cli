const path = require('path');
const Karma = require('karma').Server;

const cwd = path.resolve();

// Runs the specified integration tests
module.exports = function runUnitTests(webpackConfig) {
  const testIndex = path.join(cwd, 'tests', 'index.js');
  const preprocessors = {};
  preprocessors[`${testIndex}`] = ['webpack'];

  const karmaConfig = {
    // configFile: '', TODO: Optionally pass in an app's own karma.config.js

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

  const karma = new Karma(karmaConfig, (exitCode) => {
    console.log(`Karma exited with ${exitCode}`);
  });
  karma.start();
};
