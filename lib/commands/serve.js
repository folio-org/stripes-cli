const context = require('../cli-context');
const stripes = require('@folio/stripes-core/webpack/stripes-node-api');
const StripesPlatform = require('../platform/stripes-platform');
const { applyOptions, serverOptions, stripesConfigOptions, buildOptions } = require('./common-options');
const { cliResolve, cliAliases, emitLintWarnings } = require('../webpack-common');

function serveCommand(argv, plugin) {
  if (argv.prod) {
    console.log('Production config not yet implemented with serve');
    return;
  }

  const platform = new StripesPlatform(argv.config, context);
  const webpackOverrides = [];
  webpackOverrides.push(cliResolve(context));

  if (context.type === 'app') {
    platform.applyVirtualAppPlatform(context.moduleName);
  } else if (context.type === 'platform') {
    platform.applyVirtualPlatform();
  }
  platform.applyCommandOptions(argv);
  webpackOverrides.push(cliAliases(platform.getAliases()));

  if (argv.lint) {
    webpackOverrides.push(emitLintWarnings);
  }
  if (plugin.beforeBuild) {
    webpackOverrides.push(plugin.beforeBuild(argv));
  }

  console.log('Waiting for webpack to build...');
  stripes.serve(platform.getStripesConfig(), Object.assign({}, argv, { webpackOverrides }));
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
