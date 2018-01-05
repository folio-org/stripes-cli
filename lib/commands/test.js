const importLazy = require('import-lazy')(require);

const context = importLazy('../cli-context');
const stripes = importLazy('@folio/stripes-core/webpack/stripes-node-api');
const runIntegrationTests = importLazy('../test/integration');
const runUnitTests = importLazy('../test/unit');
const StripesPlatform = importLazy('../platform/stripes-platform');
const { applyOptions, serverOptions, okapiOptions, stripesConfigOptions } = importLazy('./common-options');
const { cliAliases, cliResolve } = importLazy('../webpack-common');
const getStripesWebpackConfig = importLazy('../test/webpack-config');

function testCommand(argv) {
  if (context.type !== 'app') {
    console.log('Tests are only supported within an app context.');
    return;
  }
  process.env.NODE_ENV = 'test';
  // TODO: check options and prompt for tests if none are specified

  const platform = new StripesPlatform(argv.configFile, context);
  const webpackOverrides = [];
  webpackOverrides.push(cliResolve(context));
  platform.applyVirtualAppPlatform(context.moduleName);
  platform.applyCommandOptions(argv);
  webpackOverrides.push(cliAliases(platform.getAliases()));

  if (argv.type === 'unit') {
    console.log('Starting unit tests...');
    const webpackConfig = getStripesWebpackConfig(platform.getStripesConfig(), Object.assign({}, argv, { webpackOverrides }));
    runUnitTests(webpackConfig);
  } else {
    console.log('Waiting for webpack to build...');
    stripes.serve(platform.getStripesConfig(), Object.assign({}, argv, { webpackOverrides }))
      .then((stats) => {
        // TODO: Check for webpack errors before running tests
        console.log('Starting integration tests...');
        runIntegrationTests(argv); // TODO: then shutdown the server
      });
  }
}

module.exports = {
  command: 'test [configFile]',
  describe: 'Run the current app module\'s tests',
  builder: (yargs) => {
    yargs
      .positional('configFile', {
        describe: 'File containing a Stripes tenant configuration',
        type: 'string',
      })
      .option('run', {
        describe: 'Name of the test script to run (e2e)',
        type: 'string',
      })
      .option('show', {
        describe: 'Show UI and dev tools while running tests (e2e)',
        type: 'boolean',
      })
      .option('type <type>', {
        describe: 'Type of tests to run',
        type: 'string',
        choices: ['e2e', 'unit'],
        default: 'e2e',
      })
      .example('$0 test --run=demo', 'Serve app and run it\'s demo.js integration tests')
      .example('$0 test --type=unit --hasAllPerms', 'Run unit tests for the current app module');
    return applyOptions(yargs, Object.assign({}, serverOptions, okapiOptions, stripesConfigOptions));
  },
  handler: testCommand,
};
