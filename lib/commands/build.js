const importLazy = require('import-lazy')(require);

const { contextMiddleware } = importLazy('../cli/context-middleware');
const { stripesConfigMiddleware } = importLazy('../cli/stripes-config-middleware');
const StripesCore = importLazy('../cli/stripes-core');
const StripesPlatform = importLazy('../platform/stripes-platform');
const { okapiOptions, stripesConfigFile, stripesConfigStdin, stripesConfigOptions, buildOptions } = importLazy('./common-options');
const { processError, processStats, emitLintWarnings, limitChunks } = importLazy('../webpack-common');

let _stripesPlatform;
let _stripesCore;

// stripesPlatform and stripesCore overrides primarily used as injection for unit tests
function stripesOverrides(stripesPlatform, stripesCore) {
  _stripesPlatform = stripesPlatform;
  _stripesCore = stripesCore;
}

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

  if (context.isPlatform && !argv.stripesConfig) {
    console.warn('Warning: Building a platform without a stripes configuration.  Did you forget to include "stripes.config.js"?');
  }

  const platform = _stripesPlatform || new StripesPlatform(argv.stripesConfig, context, argv);
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
  } else {
    argv.outputPath = './output';
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
  const stripes = _stripesCore || new StripesCore(context, platform.aliases);
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
        stripesConfigMiddleware(),
      ])
      .positional('configFile', stripesConfigFile.configFile)
      // A positional in order to remain backwards compatible with stripes-core
      .positional('outputPath', {
        describe: 'Directory to place build output',
        type: 'string',
        conflicts: 'output',
      })
      .option('output', {
        describe: 'Directory to place build output. If omitted, default value of "./output" is used.',
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
      .options(Object.assign({}, okapiOptions, stripesConfigStdin, stripesConfigOptions, buildOptions))
      .example('$0 build stripes.config.js ./output-dir', 'Build a platform (from platform directory)')
      .example('$0 build stripes.config.js ./output-dir --no-minify', 'Build a platform without minification of the bundle')
      .example('$0 build --output ./output-dir', 'Build a single ui-module (from ui-module directory)');
  },
  handler: buildCommand,
  stripesOverrides,
};
