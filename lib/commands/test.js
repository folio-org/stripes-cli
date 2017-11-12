const context = require('../cli-context')();
const stripes = require('@folio/stripes-core/webpack/stripes-node-api');
const loadConfig = require('../load-config');
const integrationTests = require('../integration-tests');
const { serverOptions, stripesConfigOptions } = require('./common-options');
const { cliAppAlias, cliResolve } = require('../webpack-common');

function testCommand(options) {
  if (context.type !== 'app') {
    console.log('Integration tests are currently only supported from within an app context.');
    return;
  }

  options.webpackOverrides = [cliResolve, cliAppAlias];
  const stripesConfig = loadConfig(null, context, options);
  // TODO: check options and prompt for tests if none are specified

  console.log('Waiting for webpack to build...');
  stripes.serve(stripesConfig, options)
    .then((stats) => {
      // TODO: Check for webpack errors before running tests
      console.log('Starting tests...');
      integrationTests(options); // TODO: then shutdown the server
    });
}

module.exports = {
  command: 'test',
  describe: 'Run tests',
  builder: Object.assign({}, serverOptions, stripesConfigOptions),
  handler: testCommand,
};
