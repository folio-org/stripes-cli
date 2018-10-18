const fs = require('fs');
const path = require('path');
const { Server, config } = require('karma');
const logger = require('../cli/logger')('karma');

function getTestIndex(cwd, dirs) {
  let file = path.join(cwd, dirs[0], 'index.js');
  let i = 0;

  while (!fs.existsSync(file) && dirs[++i]) {
    file = path.join(cwd, dirs[i], 'index.js');
  }

  return file;
}

module.exports = class KarmaService {
  constructor(cwd) {
    this.cwd = cwd;
  }

  generateKarmaConfig(webpackConfig, karmaOptions) {
    // TODO: Standardize on test folder, `test/bigtest` vs 'test' vs 'tests'
    const testIndex = getTestIndex(this.cwd, ['test/bigtest', 'test', 'tests']);

    let karmaConfig = {
      frameworks: ['mocha'],
      reporters: ['mocha'],
      port: 9876,

      browsers: ['Chrome'],

      customLaunchers: {
        // Custom launcher for CI
        ChromeHeadlessDocker: {
          base: 'ChromeHeadless',
          flags: [
            '--no-sandbox',
            '--disable-web-security'
          ]
        },
        ChromeDocker: {
          base: 'Chrome',
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

      preprocessors: {
        [testIndex]: ['webpack']
      },

      webpack: webpackConfig,

      webpackMiddleware: {
        stats: 'errors-only',
      },

      mochaReporter: {
        showDiff: true,
      },

      plugins: [
        'karma-chrome-launcher',
        'karma-firefox-launcher',
        'karma-mocha',
        'karma-webpack',
        'karma-mocha-reporter',
      ],

      coverageIstanbulReporter: {
        dir: 'artifacts/coverage',
        reports: ['text-summary', 'lcov'],
        thresholds: {
          // Thresholds under which karma will return failure
          // Modules are expected to define their own values in karma.conf.js
          global: {},
          each: {},
        }
      },
    };

    // Apply user supplied --karma options to configuration
    // Added now so they will be available within app-supplied config function
    if (karmaOptions) {
      logger.log('Applying command-line Karma options', karmaOptions);
      Object.assign(karmaConfig, karmaOptions);
    }

    if (karmaOptions.coverage) {
      logger.log('Enabling coverage');
      karmaConfig.reporters.push('coverage-istanbul');
      karmaConfig.plugins.push('karma-coverage-istanbul-reporter');
    }

    if (karmaConfig.reporters.includes('junit')) {
      logger.log('Enabling junit reporter');
      karmaConfig.plugins.push('karma-junit-reporter');
    }

    // Use Karma's parser to prep the base config
    karmaConfig = config.parseConfig(undefined, karmaConfig);

    // Check for an app-supplied Karma config and apply it
    const localConfig = path.join(this.cwd, 'karma.conf.js');
    if (fs.existsSync(localConfig)) {
      const appKarmaConfig = require(localConfig);  // eslint-disable-line
      logger.log('Applying local Karma config', localConfig);
      appKarmaConfig(karmaConfig);

      // Reapply user options so they take precedence
      if (karmaOptions) {
        Object.assign(karmaConfig, karmaOptions);
      }
    }
    return karmaConfig;
  }

  // Runs the specified integration tests
  runKarmaTests(webpackConfig, karmaOptions) {
    const karmaConfig = this.generateKarmaConfig(webpackConfig, karmaOptions);
    const karma = new Server(karmaConfig, (exitCode) => {
      console.log(`Karma exited with ${exitCode}`);
      process.exit(exitCode);
    });
    karma.start();
  }
};
