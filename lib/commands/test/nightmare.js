const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const StripesCore = importLazy('../../cli/stripes-core');
const NightmareService = importLazy('../../test/nightmare-service');
const StripesPlatform = importLazy('../../platform/stripes-platform');
const { applyOptions, serverOptions, okapiOptions, stripesConfigOptions } = importLazy('../common-options');
const { processError } = importLazy('../../webpack-common');

function nightmareCommand(argv, context) {
  // Default test command to test env
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
  }

  if (context.type !== 'app' && context.type !== 'platform') {
    console.log('Tests are only supported within an app or platform context.');
    return;
  }

  const platform = new StripesPlatform(argv.configFile, context, argv);
  const webpackOverrides = platform.getWebpackOverrides(context);

  if (context.plugin && context.plugin.beforeBuild) {
    webpackOverrides.push(context.plugin.beforeBuild(argv));
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
    console.log('Starting Nightmare tests...');
    const nightmareService = new NightmareService(context, argv);
    return nightmareService.runNightmareTests(argv)
      .then(() => {
        console.log('Tests completed successfully.');
        process.exit(0);
      })
      .catch((err) => {
        console.error('Some tests failed or something went wrong while attempting to run the tests.');
        console.error(err);
        process.exit(1);
      });
  };

  setup().then(invokeTests);
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
      .option('url', {
        describe: 'Url of FOLIO UI to run tests against',
        type: 'string',
      })
      .option('uiTest', {
        describe: 'Additional options for ui-testing framework',
      })
      .example('$0 test nightmare --run demo', 'Serve app and run it\'s demo.js Nightmare tests')
      .example('$0 test nightmare --run demo --url http://localhost:3000', 'Run Nightmare tests against an existing instance of FOLIO')
      .example('$0 test nightmare --run demo --uiTest.username admin', 'Specify a username via ui-testing options');
    return applyOptions(yargs, Object.assign({}, serverOptions, okapiOptions, stripesConfigOptions));
  },
  handler: mainHandler(nightmareCommand),
};
