const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const StripesCore = importLazy('../../cli/stripes-core');
const NightmareService = importLazy('../../test/nightmare-service');
const StripesPlatform = importLazy('../../platform/stripes-platform');
const { applyOptions, serverOptions, okapiOptions, stripesConfigOptions } = importLazy('../common-options');

function nightmareCommand(argv, context) {
  // Default test command to test env
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
  }

  if (context.type !== 'app' && context.type !== 'platform') {
    console.log('Tests are only supported within an app or platform context.');
    return;
  }

  // TODO: check options and prompt for tests if none are specified

  const platform = new StripesPlatform(argv.configFile, context, argv);
  const webpackOverrides = platform.getWebpackOverrides(context);

  if (context.plugin && context.plugin.beforeBuild) {
    webpackOverrides.push(context.plugin.beforeBuild(argv));
  }

  console.log('Waiting for webpack to build...');
  const stripes = new StripesCore(context, platform.aliases);
  stripes.api.serve(platform.getStripesConfig(), Object.assign({}, argv, { webpackOverrides }))
    .then(() => {
      // TODO: Check for webpack errors before running tests
      console.log('Starting Nightmare tests...');
      const nightmareService = new NightmareService(context, argv);
      nightmareService.runNightmareTests(argv)
        .then(() => {
          console.log('Tests completed successfully.');
          process.exit(0);
        })
        .catch((err) => {
          console.error('Some tests failed or something went wrong while attempting to run the tests.');
          console.error(err);
          process.exit(1);
        });
    });
}

module.exports = {
  command: 'nightmare [configFile]',
  describe: 'Run the current app module\'s Nightmare tests',
  builder: (yargs) => {
    yargs
      .positional('configFile', {
        describe: 'File containing a Stripes tenant configuration',
        type: 'string',
      })
      .option('run', {
        describe: 'Name of the test script to run',
        type: 'string',
      })
      .option('show', {
        describe: 'Show UI and dev tools while running tests',
        type: 'boolean',
      })
      .option('uiTest', {
        describe: 'Additional options for ui-testing framework',
      })
      .example('$0 test nightmare --run demo', 'Serve app and run it\'s demo.js Nightmare tests');
    return applyOptions(yargs, Object.assign({}, serverOptions, okapiOptions, stripesConfigOptions));
  },
  handler: mainHandler(nightmareCommand),
};
