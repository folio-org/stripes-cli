const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../cli/main-handler');
const stripes = importLazy('@folio/stripes-core/webpack/stripes-node-api');
const StripesPlatform = importLazy('../platform/stripes-platform');
const { applyOptions, serverOptions, okapiOptions, stripesConfigOptions, buildOptions } = importLazy('./common-options');
const { processError, emitLintWarnings, limitChunks } = importLazy('../webpack-common');

function serveCommand(argv, context) {
  // Default serve command to development env
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }

  if (argv.prod) {
    console.log('Production config not yet implemented with serve');
    return;
  }

  const platform = new StripesPlatform(argv.configFile, context, argv);
  if (argv.uiDev) {
    platform.applyUiDeveloperTools();
  }

  const webpackOverrides = platform.getWebpackOverrides(context.isLocalCoreAvailable);

  if (argv.lint) {
    webpackOverrides.push(emitLintWarnings);
  }
  if (argv.maxChunks) {
    webpackOverrides.push(limitChunks(argv.maxChunks));
  }
  if (context.plugin && context.plugin.beforeBuild) {
    webpackOverrides.push(context.plugin.beforeBuild(argv));
  }

  console.log('Waiting for webpack to build...');
  stripes.serve(platform.getStripesConfig(), Object.assign({}, argv, { webpackOverrides }))
    .catch(processError);
}

module.exports = {
  command: 'serve [configFile]',
  aliases: ['dev'],
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
  handler: mainHandler(serveCommand),
};
