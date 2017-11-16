const context = require('../cli-context');
const stripes = require('@folio/stripes-core/webpack/stripes-node-api');
const integrationTests = require('../integration-tests');
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
      integrationTests(argv); // TODO: then shutdown the server
    });
}

module.exports = {
  command: 'test',
  describe: 'Run the current app module\'s tests (integration)',
  builder: (yargs) => {
    yargs
      .option('show', {
        describe: 'Show UI and dev tools while running tests',
        type: 'boolean',
      })
      .example('$0 --run=demo', 'Serve app and run it\'s demo.js integration tests');
    return applyOptions(yargs, Object.assign({}, serverOptions, stripesConfigOptions));
  },
  handler: testCommand,
};
