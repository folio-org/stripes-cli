const context = require('../cli-context');
const stripes = require('@folio/stripes-core/webpack/stripes-node-api');
const runIntegrationTests = require('../test/integration');
const StripesPlatform = require('../platform/stripes-platform');
const { applyOptions, serverOptions, stripesConfigOptions } = require('./common-options');
const { cliAliases, cliResolve } = require('../webpack-common');

function testCommand(argv) {
  if (context.type !== 'app') {
    console.log('Integration tests are currently only supported from within an app context.');
    return;
  }

  // TODO: check options and prompt for tests if none are specified

  const platform = new StripesPlatform(argv.config, context);
  const webpackOverrides = [];
  webpackOverrides.push(cliResolve(context));
  platform.applyVirtualAppPlatform(context.moduleName);
  platform.applyCommandOptions(argv);
  webpackOverrides.push(cliAliases(platform.getAliases()));

  console.log('Waiting for webpack to build...');
  stripes.serve(platform.getStripesConfig(), Object.assign({}, argv, { webpackOverrides }))
    .then((stats) => {
      // TODO: Check for webpack errors before running tests
      console.log('Starting tests...');
      runIntegrationTests(argv); // TODO: then shutdown the server
    });
}

module.exports = {
  command: 'test [config]',
  describe: 'Run the current app module\'s e2e tests',
  builder: (yargs) => {
    yargs
      .positional('config', {
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
      .example('$0 test --run=demo', 'Serve app and run it\'s demo.js integration tests');
    return applyOptions(yargs, Object.assign({}, serverOptions, stripesConfigOptions));
  },
  handler: testCommand,
};
