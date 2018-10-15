const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../cli/main-handler');
const StripesCore = importLazy('../cli/stripes-core');
const StripesPlatform = importLazy('../platform/stripes-platform');
const { applyOptions, serverOptions, okapiOptions, stripesConfigOptions, buildOptions } = importLazy('./common-options');
const { processError, emitLintWarnings, limitChunks, enableMirage } = importLazy('../webpack-common');
const server = importLazy('../server');


function serveCommand(argv, context) {
  // Default serve command to development env
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }

  // When a directory is provided, there is nothing to build
  if (argv.existingBuild) {
    console.log('Serving an existing build...');
    server.start(argv.existingBuild, argv);
    return;
  }

  if (!(context.isUiModule || context.isStripesModule || context.isPlatform)) {
    console.warn('Please check that you are in the correct directory!\n"serve" should be run from an app or platform context.\n');
  }


  if (argv.prod) {
    console.log('Production config not yet implemented with serve');
    return;
  }

  const platform = new StripesPlatform(argv.configFile, context, argv);

  const webpackOverrides = platform.getWebpackOverrides(context);

  if (argv.lint) {
    webpackOverrides.push(emitLintWarnings);
  }

  if (argv.maxChunks) {
    webpackOverrides.push(limitChunks(argv.maxChunks));
  }

  if (argv.mirage) {
    console.info('Using Mirage server');
    webpackOverrides.push(enableMirage(argv.mirage));
  }

  if (context.plugin && context.plugin.beforeBuild) {
    webpackOverrides.push(context.plugin.beforeBuild(argv));
  }

  console.log('Waiting for webpack to build...');
  const stripes = new StripesCore(context, platform.aliases);
  stripes.api.serve(platform.getStripesConfig(), Object.assign({}, argv, { webpackOverrides }))
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
      .option('existing-build', {
        describe: 'Serve an existing build from the supplied directory',
        type: 'string',
        conflicts: 'configFile',
      })
      .option('mirage [scenario]', {
        describe: 'Enable Mirage Server when available and specify a scenario',
        type: 'string',
      })
      .example('$0 serve --hasAllPerms', 'Serve an app (in app context) with permissions flag set for development')
      .example('$0 serve stripes.config.js', 'Serve a platform defined by the supplied configuration')
      .example('$0 serve --existing-build output', 'Serve a build previously created with "stripes build"')
      .example('$0 serve --mirage', 'Serve an app (in app context) with a mock backend server"');
    return applyOptions(yargs, Object.assign({}, serverOptions, okapiOptions, stripesConfigOptions, buildOptions));
  },
  handler: mainHandler(serveCommand),
};
