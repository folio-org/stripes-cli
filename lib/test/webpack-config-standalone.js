const process = require('process');
const path = require('path');
const getStripesWebpackConfig = require('./webpack-config');
const StripesCore = require('../cli/stripes-core');

module.exports = function getStripesWebpackConfigStandalone() {
  const cwd = process.cwd();
  const cliRoot = path.resolve('@folio/stripes-cli');
  const stripesCore = new StripesCore({ cwd, cliRoot }, { '@folio/stripes-webpack': '@folio/stripes-webpack' });

  const componentsStripesConfig = { config: [], modules:[], languages: [] };
  const webpackConfig = getStripesWebpackConfig(stripesCore, componentsStripesConfig, { config: componentsStripesConfig }, {});
  return webpackConfig;
};
