const context = require('../cli-context');
const stripes = require('@folio/stripes-core/webpack/stripes-node-api');
const loadConfig = require('../load-config');
const { applyOptions, serverOptions, stripesConfigOptions, buildOptions } = require('./common-options');
const { cliAppAlias, cliResolve, cliPlatformAlias } = require('../webpack-common');

function serveCommand(argv) {
  if (argv.prod) {
    console.log('Production config not yet implemented with serve');
    return;
  }

  const stripesConfig = loadConfig(argv.config, context, argv);

  argv.webpackOverrides = [];
  argv.webpackOverrides.push(cliResolve);
  if (context.type === 'app') {
    argv.webpackOverrides.push(cliAppAlias);
  } else if (context.type === 'platform') {
    argv.webpackOverrides.push(cliPlatformAlias);
  }

  console.log('Waiting for webpack to build...');
  stripes.serve(stripesConfig, argv);
}

module.exports = {
  command: 'serve [config]',
  describe: 'Serve up a development build of Stripes',
  builder: (yargs) => {
    yargs
      .positional('config', {
        describe: 'File containing a Stripes tenant configuration',
        type: 'string',
      })
      .example('$0 serve --hasAllPerms', 'Serve an app (in app context) with permissions flag set for development')
      .example('$0 serve stripes.config.js', 'Serve a platform defined by the supplied configuration');
    return applyOptions(yargs, Object.assign({}, serverOptions, stripesConfigOptions, buildOptions));
  },
  handler: serveCommand,
};
