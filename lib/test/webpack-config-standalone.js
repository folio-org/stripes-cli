const process = require('process');
const path = require('path');
const getStripesWebpackConfig = require('./webpack-config');
const StripesCore = require('../cli/stripes-core');

module.exports = function getStripesWebpackConfigStandalone() {
  const context = {
    moduleName: process.env.stripesCLIContextModuleName || '',
    cwd: process.cwd(),
    cliRoot: path.resolve('@folio/stripes-cli')
  };

  const stripesCore = new StripesCore(context, { '@folio/stripes-webpack': '@folio/stripes-webpack' });

  const componentsStripesConfig = { config: [], modules:[], languages: [] };
  const webpackConfig = getStripesWebpackConfig(stripesCore, componentsStripesConfig, { config: componentsStripesConfig }, context);
  return webpackConfig;
};
