const importLazy = require('import-lazy')(require);

const { contextMiddleware } = importLazy('../../cli/context-middleware');
const { stripesConfigMiddleware } = importLazy('../../cli/stripes-config-middleware');
const KarmaService = importLazy('../../test/karma-service');
const StripesPlatform = importLazy('../../platform/stripes-platform');
const { serverOptions, okapiOptions, stripesConfigFile, stripesConfigStdin, stripesConfigOptions } = importLazy('../common-options');
const StripesCore = importLazy('../../cli/stripes-core');

function karmaCommand(argv) {
  const context = argv.context;
  // Default test command to test env
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
  }

  if (!(context.isUiModule || context.isStripesModule)) {
    console.log('Tests are only supported within an app context.');
    return;
  }

  const platform = new StripesPlatform(argv.stripesConfig, context, argv);
  const webpackOverrides = platform.getWebpackOverrides(context);

  if (context.plugin && context.plugin.beforeBuild) {
    webpackOverrides.push(context.plugin.beforeBuild(argv));
  }

  console.log('Starting Karma tests...');
  const stripes = new StripesCore(context, platform.aliases);
  const webpackConfigOptions = {
    coverage: argv.coverage,
    omitPlatform: context.type === 'components',
    bundle: argv.bundle,
    webpackOverrides,
  };
  const webpackConfig = stripes.getStripesWebpackConfig(platform.getStripesConfig(), webpackConfigOptions, context);

  const karmaService = new KarmaService(context.cwd);
  karmaService.runKarmaTests(webpackConfig, argv.karma);
}

module.exports = {
  command: 'karma [configFile]',
  describe: 'Run the current app module\'s Karma tests',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
        stripesConfigMiddleware(),
      ])
      .positional('configFile', stripesConfigFile.configFile)
      .option('coverage', {
        describe: 'Enable Karma coverage reports',
        type: 'boolean',
        alias: 'karma.coverage', // this allows --coverage to be passed to Karma
      })
      .option('bundle', {
        describe: 'Create and use a production bundle retaining test hooks',
        type: 'boolean'
      })
      .option('karma', {
        describe: 'Options passed to Karma using dot-notation and camelCase: --karma.browsers=Chrome --karma.singleRun',
      })
      .option('karma.browsers', { type: 'array', hidden: true }) // defined but hidden so yargs will parse as an array
      .option('karma.reporters', { type: 'array', hidden: true })
      .option('watch', { type: 'boolean', describe: 'Watch test files for changes and run tests automatically when changes are saved.' })
      .option('cache', { type: 'boolean', describe: 'Enable caching of test bundle. Defaults to false.'})
      .options(Object.assign({}, serverOptions, okapiOptions, stripesConfigStdin, stripesConfigOptions))
      .example('$0 test karma', 'Run tests with Karma for the current app module');
  },
  handler: karmaCommand,
};
