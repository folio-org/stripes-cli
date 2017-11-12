const context = require('../cli-context')();
const stripes = require('@folio/stripes-core/webpack/stripes-node-api');
const loadConfig = require('../load-config');
const { serverOptions, stripesConfigOptions } = require('./common-options');
const { cliAppAlias, cliResolve } = require('../webpack-common');

function serveCommand(options) {
  const stripesConfig = loadConfig(options.configFile, context, options);

  options.webpackOverrides = [];
  options.webpackOverrides.push(cliResolve);
  if (context.type === 'app') {
    options.webpackOverrides.push(cliAppAlias);
  }

  stripes.serve(stripesConfig, options);
}

module.exports = {
  command: 'serve',
  describe: 'Serve up a development build of Stripes',
  builder: Object.assign({}, serverOptions, stripesConfigOptions),
  handler: serveCommand,
};
