const path = require('path');

// TODO: Move this to stripes-core and expose as part of the Stripes Node API
// Generates a webpack config for Stripes independent of build or serve
module.exports = function getStripesWebpackConfig(stripeCore, stripesConfig, options) {
  const StripesWebpackPlugin = stripeCore.getCoreModule('webpack/stripes-webpack-plugin');
  const applyWebpackOverrides = stripeCore.getCoreModule('webpack/apply-webpack-overrides');

  // TODO: Switch between dev and prod files bases on env
  let config = stripeCore.getCoreModule('webpack.config.cli.dev');

  // Omit all other entry points and don't bother adding stripes plugins when tests don't require a platform
  if (options.omitPlatform) {
    config.entry = ['webpack-hot-middleware/client'];
  } else {
    config.plugins.push(new StripesWebpackPlugin({ stripesConfig }));
  }

  const platformModulePath = path.join(path.resolve(), 'node_modules');
  const coreModulePath = path.join(stripeCore.corePath, 'node_modules');
  config.resolve.modules = ['node_modules', platformModulePath, coreModulePath];
  config.resolveLoader = { modules: ['node_modules', platformModulePath, coreModulePath] };

  // Inject babel-plugin-istanbul when coverage is enabled
  if (options.coverage) {
    const babelLoaderConfigIndex = config.module.rules.findIndex((rule) => {
      return rule.loader === 'babel-loader';
    });
    if (!config.module.rules[babelLoaderConfigIndex].options.plugins) {
      config.module.rules[babelLoaderConfigIndex].options.plugins = [];
    }
    config.module.rules[babelLoaderConfigIndex].options.plugins.push(
      require.resolve('babel-plugin-istanbul')
    );
  }

  // Remove HMR plugin during testing
  config.plugins = config.plugins.filter(plugin => {
    return plugin.constructor.name !== 'HotModuleReplacementPlugin';
  });

  config = applyWebpackOverrides(options.webpackOverrides, config);
  return config;
};
