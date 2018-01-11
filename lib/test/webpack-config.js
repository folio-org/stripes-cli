const StripesConfigPlugin = require('@folio/stripes-core/webpack/stripes-config-plugin');
const StripesBrandingPlugin = require('@folio/stripes-core/webpack/stripes-branding-plugin');
const applyWebpackOverrides = require('@folio/stripes-core/webpack/apply-webpack-overrides');
const webpack = require('webpack');
const path = require('path');


// TODO: Move this to stripes-core and expose as part of the Stripes Node API
// Generates a webpack config for Stripes independent of build or serve
module.exports = function getStripesWebpackConfig(stripesConfig, options) {
  // TODO: Switch between dev and prod files bases on env
  let config = require('@folio/stripes-core/webpack.config.cli.dev'); // eslint-disable-line
  config.plugins.push(new StripesConfigPlugin(stripesConfig));
  config.plugins.push(new StripesBrandingPlugin(stripesConfig));
  config.plugins.push(new webpack.EnvironmentPlugin(['NODE_ENV']));
  const platformModulePath = path.join(path.resolve(), 'node_modules'); // TODO: Verify
  config.resolve.modules = ['node_modules', platformModulePath];
  config.resolveLoader = { modules: ['node_modules', platformModulePath] };
  config = applyWebpackOverrides(options.webpackOverrides, config);
  return config;
};
