const context = require('../cli-context');
const StripesConfigPlugin = require('@folio/stripes-core/webpack/stripes-config-plugin');
const applyWebpackOverrides = require('@folio/stripes-core/webpack/apply-webpack-overrides');
const unitTests = require('../test/unit');
const StripesPlatform = require('../platform/stripes-platform');
const { applyOptions, stripesConfigOptions } = require('./common-options');
const { cliAliases, cliResolve } = require('../webpack-common');
const webpack = require('webpack');
const path = require('path');


// TODO: Move this to stripes-core and expose as part of the Stripes Node API
// Generates a webpack config for Stripes independent of build or serve
function getStripesWebpackConfig(stripesConfig, options) {
  // TODO: Switch between dev and prod files bases on env
  let config = require('@folio/stripes-core/webpack.config.cli.dev'); // eslint-disable-line
  config.plugins.push(new StripesConfigPlugin(stripesConfig));
  config.plugins.push(new webpack.EnvironmentPlugin(['NODE_ENV']));
  const platformModulePath = path.join(path.resolve(), 'node_modules'); // TODO: Verify
  config.resolve.modules = ['node_modules', platformModulePath];
  config.resolveLoader = { modules: ['node_modules', platformModulePath] };
  config = applyWebpackOverrides(options.webpackOverrides, config);
  return config;
}

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
