const importLazy = require('import-lazy')(require);

const { contextMiddleware } = importLazy('../../cli/context-middleware');
const { stripesConfigMiddleware } = importLazy('../../cli/stripes-config-middleware');
const StripesCore = importLazy('../../cli/stripes-core');
const NightmareService = importLazy('../../test/nightmare-service');
const StripesPlatform = importLazy('../../platform/stripes-platform');
const { serverOptions, okapiOptions, stripesConfigFile, stripesConfigStdin, stripesConfigOptions } = importLazy('../common-options');
const { processError, enableCoverage } = importLazy('../../webpack-common');

function nightmareCommand(argv) {
  const context = argv.context;
  // Default test command to test env
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
  }

  if (!context.isUiModule && !context.isPlatform) {
    console.log('Tests are only supported within an app or platform context.');
    return;
  }

  const platform = new StripesPlatform(argv.stripesConfig, context, argv);
  const webpackOverrides = platform.getWebpackOverrides(context);

  if (context.plugin && context.plugin.beforeBuild) {
    webpackOverrides.push(context.plugin.beforeBuild(argv));
  }

  if (argv.coverage) {
    webpackOverrides.push(enableCoverage);
  }
  const nightmareService = new NightmareService(context, argv);
  // Convenience to refer to a build running on localhost
  if (argv.local) {
    if (argv.host && argv.port) {
      argv.url = `http://${argv.host}:${argv.port}`;
    } else {
      argv.url = 'http://localhost:3000';
    }
  }

  const setup = () => {
    if (argv.url) {
      console.log(`Using URL ${argv.url}`);
      return Promise.resolve();
    } else {
      console.log('Waiting for webpack to build...');
      const stripes = new StripesCore(context, platform.aliases);
      return stripes.api.serve(platform.getStripesConfig(), Object.assign({}, argv, { webpackOverrides }))
        .catch(processError);
    }
  };

  const invokeTests = () => {
    const status = {};
    console.log('Starting Nightmare tests...');
    return nightmareService.runNightmareTests(argv)
      .then(() => {
        console.log('Tests completed successfully.');
        status.testsSuccessful = true;
        return status;
      })
      .catch((err) => {
        console.error('Some tests failed or something went wrong while attempting to run the tests.');
        console.error(err);
        status.testsSuccessful = false;
        return status;
      });
  };
  const runCoverageIfNeeded = (status) => {
    if (argv.coverage) {
      console.log('running coverage');
      return nightmareService.runCoverageReport().then(() => {
        status.coverageSuccessful = true;
        console.log('Coverage completed successfully.');
        return status;
      }).catch(() => {
        status.coverageSuccessful = false;
        console.log('Coverage failed');
        return status;
      });
    } else {
      return status;
    }
  };
  const exitProcessWithStatus = (status) => {
    for (const key in status) {
      if (status[key] === false) {
        console.log('exiting process with failure(1)');
        process.exit(1);
      }
    }
    console.log('exiting process with success(0)');
    process.exit(0);
  };
  setup().then(invokeTests).then(runCoverageIfNeeded).then(exitProcessWithStatus);
}

module.exports = {
  command: 'nightmare [configFile]',
  describe: 'Run the current app module\'s Nightmare tests',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
        stripesConfigMiddleware(),
      ])
      .positional('configFile', stripesConfigFile.configFile)
      .option('run', {
        describe: 'Name of the test script to run',
        type: 'string',
      })
      .option('show', {
        describe: 'Show UI and dev tools while running tests',
        type: 'boolean',
      })
      .option('url', {
        describe: 'URL of FOLIO UI to run tests against',
        type: 'string',
      })
      .option('local', {
        describe: 'Shortcut for --url http://localhost:3000',
        type: 'boolean',
        default: undefined,
        conflicts: 'url',
      })
      .option('uiTest', {
        describe: 'Additional options for ui-testing framework',
      })
      .option('reporter', {
        describe: 'Specify a Mocha reporter',
      })
      .options(Object.assign({}, serverOptions, okapiOptions, stripesConfigStdin, stripesConfigOptions))
      .example('$0 test nightmare', 'Serve app or platform and run all of its Nightmare tests')
      .example('$0 test nightmare --run demo', 'Serve app or platform and run its demo.js Nightmare tests')
      .example('$0 test nightmare --local', 'Run Nightmare tests against a locally hosted instance of FOLIO')
      .example('$0 test nightmare --url https://folio-testing.dev.folio.org/', 'Run Nightmare tests against an external instance of FOLIO')
      .example('$0 test nightmare --uiTest.username admin', 'Specify a username via ui-testing\'s test-module CLI options');
  },
  handler: nightmareCommand,
};
