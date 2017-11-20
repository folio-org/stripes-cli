const context = require('../cli-context');
const unitTests = require('../test/unit');
const StripesPlatform = require('../platform/stripes-platform');
const { applyOptions, stripesConfigOptions } = require('./common-options');
const { cliAliases, cliResolve } = require('../webpack-common');
const getStripesWebpackConfig = require('../test/webpack-config');


function testCommand(argv) {
  if (context.type !== 'app') {
    console.log('Unit tests are only supported within an app context.');
    return;
  }
  process.env.NODE_ENV = 'test';

  const platform = new StripesPlatform(argv.config, context);
  const webpackOverrides = [];
  webpackOverrides.push(cliResolve(context));
  platform.applyVirtualAppPlatform(context.moduleName);
  platform.applyCommandOptions(argv);
  webpackOverrides.push(cliAliases(platform.getAliases()));

  const webpackConfig = getStripesWebpackConfig(platform.getStripesConfig(), Object.assign({}, argv, { webpackOverrides }));
  unitTests(webpackConfig);
}

module.exports = {
  command: 'unit [config]',
  describe: 'Run the current app module\'s unit tests',
  builder: (yargs) => {
    yargs
      .positional('config', {
        describe: 'File containing a Stripes tenant configuration',
        type: 'string',
      })
      .example('$0 unit --hasAllPerms', 'Run unit tests for the current app module');
    return applyOptions(yargs, Object.assign({}, stripesConfigOptions));
  },
  handler: testCommand,
};
