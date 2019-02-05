const importLazy = require('import-lazy')(require);

const { contextMiddleware } = importLazy('../cli/context-middleware');
const StripesCore = importLazy('../cli/stripes-core');
const StripesPlatform = importLazy('../platform/stripes-platform');
const { applyOptions, okapiOptions, stripesConfigOptions, buildOptions } = importLazy('./common-options');
const { processError, processStats, emitLintWarnings, limitChunks } = importLazy('../webpack-common');


function buildCommand(argv) {
  const context = argv.context;
  // Default build command to production env
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }

  if (argv.dev) {
    console.log('Development config not yet implemented with build');
    return;
  }

  if (context.isPlatform && !argv.configFile) {
    console.warn('Warning: Building a platform without a stripes configuration.  Did you forget to include "stripes.config.js"?');
  }

  const platform = new StripesPlatform(argv.configFile, context, argv);
  const webpackOverrides = platform.getWebpackOverrides(context);

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
  const stripes = new StripesCore(context, platform.aliases);
  stripes.api.build(platform.getStripesConfig(), Object.assign({}, argv, { webpackOverrides }))
    .then(processStats)
    .catch(processError);
}

module.exports = {
  command: 'build [configFile] [outputPath]',
  describe: 'Build a Stripes tenant bundle',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
      ])
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
      .option('minify', {
        describe: 'Minify the bundle output',
        type: 'boolean',
        default: true,
      })
      .example('$0 build stripes.config.js ./output-dir', 'Build a platform (from platform directory)')
      .example('$0 build stripes.config.js ./output-dir --no-minify', 'Build a platform without minification of the bundle')
      .example('$0 build --output ./output-dir', 'Build a single ui-module (from ui-module directory)');
    return applyOptions(yargs, Object.assign({}, okapiOptions, stripesConfigOptions, buildOptions));
  },
  handler: buildCommand,
};
