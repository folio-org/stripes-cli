const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../cli/main-handler');
const stripes = importLazy('@folio/stripes-core/webpack/stripes-node-api');
const StripesPlatform = importLazy('../platform/stripes-platform');
const { applyOptions, okapiOptions, stripesConfigOptions, buildOptions } = importLazy('./common-options');
const { processError, processStats, emitLintWarnings, limitChunks } = importLazy('../webpack-common');


function buildCommand(argv, context) {
  // Default build command to production env
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }

  if (argv.dev) {
    console.log('Development config not yet implemented with build');
    return;
  }

  const platform = new StripesPlatform(argv.configFile, context, argv);
  const webpackOverrides = platform.getWebpackOverrides(context.isLocalCoreAvailable);

  if (argv.analyze) {
    const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin; // eslint-disable-line
    webpackOverrides.push((config) => {
      config.plugins.push(new BundleAnalyzerPlugin());
      return config;
    });
  }

  if (argv.output) {
    argv.outputPath = argv.output;
  }
  if (argv.lint) {
    webpackOverrides.push(emitLintWarnings);
  }
  if (argv.maxChunks) {
    webpackOverrides.push(limitChunks(argv.maxChunks));
  }
  if (context.plugin && context.plugin.beforeBuild) {
    webpackOverrides.push(context.plugin.beforeBuild(argv));
  }

  // TODO: Check stripes-core location and aliases to warn if build is unsuitable for production.

  console.log('Building...');
  stripes.build(platform.getStripesConfig(), Object.assign({}, argv, { webpackOverrides }))
    .then(processStats)
    .catch(processError);
}

module.exports = {
  command: 'build [configFile] [outputPath]',
  describe: 'Build a Stripes tenant bundle',
  builder: (yargs) => {
    yargs
      .positional('configFile', {
        describe: 'File containing a Stripes tenant configuration',
        type: 'string',
      })
      // A positional in order to remain backwards compatible with stripes-core
      .positional('outputPath', {
        describe: 'Directory to place build output',
        type: 'string',
        conflicts: 'output',
      })
      .option('output', {
        describe: 'Directory to place build output',
        type: 'string',
      })
      .option('sourcemap', {
        describe: 'Include sourcemaps in build output',
        type: 'boolean',
        conflicts: 'devtool',
      })
      .option('analyze', {
        describe: 'Run the Webpack Bundle Analyzer after build (launches in browser)',
        type: 'boolean',
      })
      .example('$0 build stripes.config.js dir', 'Platform context build')
      .example('$0 build --output=dir', 'App context build using virtual platform');
    return applyOptions(yargs, Object.assign({}, okapiOptions, stripesConfigOptions, buildOptions));
  },
  handler: mainHandler(buildCommand),
};
