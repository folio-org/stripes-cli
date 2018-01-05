const importLazy = require('import-lazy')(require);

const context = importLazy('../cli-context');
const stripes = importLazy('@folio/stripes-core/webpack/stripes-node-api');
const StripesPlatform = importLazy('../platform/stripes-platform');
const { applyOptions, serverOptions, okapiOptions, stripesConfigOptions, buildOptions } = importLazy('./common-options');
const { cliResolve, cliAliases, emitLintWarnings, limitChunks } = importLazy('../webpack-common');

function serveCommand(argv, plugin) {
  if (argv.prod) {
    console.log('Production config not yet implemented with serve');
    return;
  }

  const platform = new StripesPlatform(argv.configFile, context);
  const webpackOverrides = [];
  webpackOverrides.push(cliResolve(context));

  if (context.type === 'app') {
    platform.applyVirtualAppPlatform(context.moduleName);
    if (argv.uiDev) {
      platform.applyUiDeveloperTools();
    }
  } else if (context.type === 'platform') {
    platform.applyVirtualPlatform();
  }
  platform.applyCommandOptions(argv);
  webpackOverrides.push(cliAliases(platform.getAliases()));

  if (argv.lint) {
    webpackOverrides.push(emitLintWarnings);
  }
  if (argv.maxChunks) {
    webpackOverrides.push(limitChunks(argv.maxChunks));
  }
  if (plugin && plugin.beforeBuild) {
    webpackOverrides.push(plugin.beforeBuild(argv));
  }

  console.log('Waiting for webpack to build...');
  stripes.serve(platform.getStripesConfig(), Object.assign({}, argv, { webpackOverrides }));
}

module.exports = {
  command: 'serve [configFile]',
  describe: 'Serve up a development build of Stripes',
  builder: (yargs) => {
    yargs
      .positional('configFile', {
        describe: 'File containing a Stripes tenant configuration',
        type: 'string',
      })
      .option('uiDev', {
        describe: 'Include Stripes ui-developer tools (app context)',
        type: 'boolean',
        group: 'Stripes Options:',
      })
      .example('$0 serve --hasAllPerms', 'Serve an app (in app context) with permissions flag set for development')
      .example('$0 serve stripes.config.js', 'Serve a platform defined by the supplied configuration');
    return applyOptions(yargs, Object.assign({}, serverOptions, okapiOptions, stripesConfigOptions, buildOptions));
  },
  handler: serveCommand,
};
