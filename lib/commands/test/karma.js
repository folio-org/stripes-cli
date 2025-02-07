import { contextMiddleware } from '../../cli/context-middleware.js';
import { stripesConfigMiddleware } from '../../cli/stripes-config-middleware.js';
import KarmaService from '../../test/karma-service.js';
import StripesPlatform from '../../platform/stripes-platform.js';
import { serverOptions, okapiOptions, stripesConfigFile, stripesConfigStdin, stripesConfigOptions } from '../common-options.js';
import StripesCore from '../../cli/stripes-core.js';

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

  // This fixes the warnings similar to:
  // WARNING in ./node_modules/mocha/mocha-es2018.js 18541:26-55
  // Critical dependency: the request of a dependency is an expression
  // https://github.com/mochajs/mocha/issues/2448#issuecomment-355222358
  webpackConfig.module.exprContextCritical = false;

  // This fixes warning:
  // WARNING in DefinePlugin
  // Conflicting values for 'process.env.NODE_ENV'
  // https://webpack.js.org/configuration/mode/#usage
  webpackConfig.mode = 'none';

  const karmaService = new KarmaService(context.cwd);
  karmaService.runKarmaTests(webpackConfig, Object.assign({}, argv.karma, { watch: argv.watch, cache: argv.cache }));
}

export default {
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
      .option('cache', { type: 'boolean', describe: 'Enable caching of test bundle. Defaults to false.' })
      .options(Object.assign({}, serverOptions, okapiOptions, stripesConfigStdin, stripesConfigOptions))
      .example('$0 test karma', 'Run tests with Karma for the current app module');
  },
  handler: karmaCommand,
};
