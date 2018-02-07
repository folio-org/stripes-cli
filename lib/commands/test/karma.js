const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const runUnitTests = importLazy('../../test/unit');
const StripesPlatform = importLazy('../../platform/stripes-platform');
const { applyOptions, serverOptions, okapiOptions, stripesConfigOptions } = importLazy('../common-options');
const getStripesWebpackConfig = importLazy('../../test/webpack-config');

function karmaCommand(argv, context) {
  // Default test command to test env
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
  }

  if (context.type !== 'app') {
    console.log('Tests are only supported within an app context.');
    return;
  }

  const platform = new StripesPlatform(argv.configFile, context, argv);
  const webpackOverrides = platform.getWebpackOverrides(context.isLocalCoreAvailable);

  if (context.plugin && context.plugin.beforeBuild) {
    webpackOverrides.push(context.plugin.beforeBuild(argv));
  }

  console.log('Starting Karma tests...');
  const webpackConfig = getStripesWebpackConfig(platform.getStripesConfig(), Object.assign({}, argv, { webpackOverrides }));
  runUnitTests(webpackConfig, argv.karma);
}

module.exports = {
  command: 'karma [configFile]',
  describe: 'Run the current app module\'s Karma tests',
  builder: (yargs) => {
    yargs
      .positional('configFile', {
        describe: 'File containing a Stripes tenant configuration',
        type: 'string',
      })
      .option('karma', {
        describe: 'Options passed to Karma using dot-notation and camelCase: --karma.browsers=Chrome --karma.singleRun',
      })
      .option('karma.browsers', { type: 'array', hidden: true }) // defined but hidden so yargs will parse as an array
      .option('karma.reporters', { type: 'array', hidden: true })
      .example('$0 test karma', 'Run tests with Karma for the current app module');
    return applyOptions(yargs, Object.assign({}, serverOptions, okapiOptions, stripesConfigOptions));
  },
  handler: mainHandler(karmaCommand),
};
