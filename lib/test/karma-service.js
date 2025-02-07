import fs from 'fs';
import path from 'path';
import os from 'os';
import _ from 'lodash';
import karma from 'karma';
import getLogger from '../cli/logger.js';

const { Server, config } = { karma };

const logger = getLogger('karma');
function getTestIndex(cwd, dirs) {
  let file = path.join(cwd, dirs[0], 'index.js');
  let i = 0;

  while (!fs.existsSync(file) && dirs[++i]) {
    file = path.join(cwd, dirs[i], 'index.js');
  }

  return file;
}

export default class KarmaService {
  constructor(cwd) {
    this.cwd = cwd;
  }

  generateKarmaConfig(webpackConfig, karmaOptions) {
    // TODO: Standardize on test folder, `test/bigtest` vs 'test' vs 'tests'
    const testIndex = getTestIndex(this.cwd, ['test/bigtest', 'test', 'tests']);

    // karma webpack, ignores 'entry' so to keep it from griping, just exclude it.
    const {
      entry, // eslint-disable-line no-unused-vars
      ...webpackConfigRest
    } = webpackConfig;

    const output = {
      // The path defined here is the same as what karma-webpack is using by default.
      // https://github.com/ryanclark/karma-webpack/blob/master/lib/webpack/defaults.js#L10

      // We are redefining it here so we can work around a current limitation
      // related to static files (translations) not loading correctly.
      // Please see more comments under:
      // https://github.com/ryanclark/karma-webpack/issues/498
      path: path.join(os.tmpdir(), '_karma_webpack_') + Math.floor(Math.random() * 1000000),
    };

    // set webpack's watch/cache features via karma config.
    // these features are unnecessary in the CI environment, so we turn them off by default.
    // They can be enabled individually via command-line options '--watch' and '--cache'.
    let webpackTestConfig = {};
    webpackTestConfig.watch = !!karmaOptions?.watch;
    webpackTestConfig.cache = !!karmaOptions?.cache;
    // only apply 'false' options as overrides to what karma-webpack wants to set.
    webpackTestConfig = _.pickBy(webpackTestConfig, (opt) => !opt);

    let karmaConfig = {
      frameworks: ['mocha', 'webpack'],
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
        // use output.path to work around the issue with loading
        // static files
        // https://github.com/ryanclark/karma-webpack/issues/498
        {
          pattern: `${output.path}/**/*`,
          watched: false,
          included: false,
          served: true,
        },
      ],

      preprocessors: {
        [testIndex]: ['webpack']
      },

      webpack: {
        ...webpackConfigRest,
        ...webpackTestConfig,
        output,
      },
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

    if (karmaOptions && karmaOptions.coverage) {
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
    const karmaServer = new Server(karmaConfig, (exitCode) => {
      console.log(`Karma exited with ${exitCode}`);
      process.exit(exitCode);
    });
    karmaServer.start();
  }
}
