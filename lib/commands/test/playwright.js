const importLazy = require('import-lazy')(require);

const { contextMiddleware } = importLazy('../../cli/context-middleware');
const { stripesConfigMiddleware } = importLazy('../../cli/stripes-config-middleware');
const PlaywrightService = importLazy('../../test/playwright-service');
const StripesPlatform = importLazy('../../platform/stripes-platform');
const { serverOptions, okapiOptions, stripesConfigFile, stripesConfigStdin, stripesConfigOptions } = importLazy('../common-options');
const StripesCore = importLazy('../../cli/stripes-core');

async function playwrightCommand(argv) {
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

  console.log('Starting Playwright tests...');
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

  // set webpack's cache feature via the command line; it is unnecessary in CI so it is off by default.
  if (!argv.cache) {
    webpackConfig.cache = false;
  }

  const service = new PlaywrightService(context.cwd);
  try {
    const passed = await service.runTests(webpackConfig, {
      browser: argv.browser,
      coverage: argv.coverage,
      grep: argv.grep,
      headed: argv.headed,
      junit: argv.junit,
      verbose: argv.verbose,
      watch: argv.watch,
    });
    process.exit(passed ? 0 : 1);
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
}

module.exports = {
  command: 'playwright [configFile]',
  describe: 'Run the current app module\'s tests in a Playwright-driven browser',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
        stripesConfigMiddleware(),
      ])
      .positional('configFile', stripesConfigFile.configFile)
      .option('coverage', {
        describe: 'Enable coverage reports (artifacts/coverage)',
        type: 'boolean',
      })
      .option('bundle', {
        describe: 'Create and use a production bundle retaining test hooks',
        type: 'boolean'
      })
      .option('browser', {
        describe: 'Browser to run the tests in',
        choices: ['chromium', 'firefox', 'webkit'],
        default: 'chromium',
      })
      .option('headed', { type: 'boolean', describe: 'Show the browser window instead of running headless.' })
      .option('grep', { type: 'string', describe: 'Only run tests whose full title matches this pattern.' })
      .option('junit', { type: 'boolean', describe: 'Write a JUnit XML report to artifacts/runTest.' })
      .option('verbose', { type: 'boolean', describe: 'Print passing tests as well as failures.' })
      .option('watch', { type: 'boolean', describe: 'Watch test files for changes and run tests automatically when changes are saved.' })
      .option('cache', { type: 'boolean', describe: 'Enable caching of test bundle. Defaults to false.' })
      .options(Object.assign({}, serverOptions, okapiOptions, stripesConfigStdin, stripesConfigOptions))
      .example('$0 test playwright', 'Run tests with Playwright for the current app module')
      .example('$0 test playwright --coverage --junit', 'Run tests and write coverage and JUnit reports')
      .example('$0 test playwright --watch --headed', 'Re-run tests in a visible browser when files change');
  },
  handler: playwrightCommand,
};
