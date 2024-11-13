const importLazy = require('import-lazy')(require);
// const fs = require('fs');
// const child = require('child_process');

const { contextMiddleware } = importLazy('../../cli/context-middleware');
const { stripesConfigMiddleware } = importLazy('../../cli/stripes-config-middleware');
const { CypressService } = importLazy('../../test/cypress-service');
const StripesPlatform = importLazy('../../platform/stripes-platform');
const { serverOptions, okapiOptions, stripesConfigFile, stripesConfigStdin, stripesConfigOptions } = importLazy('../common-options');
const StripesCore = importLazy('../../cli/stripes-core');

function cypressCommand(argv) {
  const context = argv.context;

  // pass moduleName up to globals so that it can be accessed for standalone webpack config.
  process.env.stripesCLIContextModuleName = context.moduleName;

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

  console.log('Starting Cypress tests...');
  const stripes = new StripesCore(context, platform.aliases);
  const webpackConfigOptions = {
    coverage: argv.coverage,
    omitPlatform: context.type === 'component',
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

  const cypressService = new CypressService(context.cwd);
  cypressService.runCypressTests(webpackConfig, Object.assign({}, argv.cypress, { watch: argv.watch, cache: argv.cache }), context);
}

module.exports = {
  command: 'cypress [configFile]',
  describe: 'Run the current app module\'s Cypress tests',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
        stripesConfigMiddleware(),
      ])
      .positional('configFile', stripesConfigFile.configFile)
      .option('coverage', {
        describe: 'Enable Cypress coverage reports',
        type: 'boolean',
        alias: 'cypress.coverage', // this allows --coverage to be passed to Cypress
      })
      .option('bundle', {
        describe: 'Create and use a production bundle retaining test hooks',
        type: 'boolean'
      })
      .option('cypress', {
        describe: 'Options passed to Cypress using dot-notation and camelCase: --cypress.browsers=Chrome --cypress.singleRun',
      })
      .option('cypress.open', { type: 'boolean', describe: 'run cypress in ui mode' })
      .option('cypress.browsers', { type: 'array', hidden: true }) // defined but hidden so yargs will parse as an array
      .option('cypress.reporters', { type: 'array', hidden: true })
      .option('watch', { type: 'boolean', describe: 'Watch test files for changes and run tests automatically when changes are saved.' })
      .option('cache', { type: 'boolean', describe: 'Enable caching of test bundle. Defaults to false.' })
      .options(Object.assign({}, serverOptions, okapiOptions, stripesConfigStdin, stripesConfigOptions))
      .example('$0 test cypress', 'Run tests with Cypress for the current app module');
  },
  handler: cypressCommand,
};
