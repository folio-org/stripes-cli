const importLazy = require('import-lazy')(require);

const context = importLazy('../cli-context');
const stripes = importLazy('@folio/stripes-core/webpack/stripes-node-api');
const StripesPlatform = importLazy('../platform/stripes-platform');
const { applyOptions, okapiOptions, stripesConfigOptions, buildOptions } = importLazy('./common-options');
const { processError, processStats, cliResolve, cliAliases, emitLintWarnings, limitChunks } = importLazy('../webpack-common');


function buildCommand(argv, plugin) {
  if (argv.dev) {
    console.log('Development config not yet implemented with build');
    return;
  } else {
    process.env.NODE_ENV = 'production';
  }

  const platform = new StripesPlatform(argv.configFile, context);
  const webpackOverrides = [];
  webpackOverrides.push(cliResolve(context));

  if (context.type === 'app') {
    platform.applyVirtualAppPlatform(context.moduleName);
  } else if (context.type === 'platform') {
    platform.applyVirtualPlatform();
  }
  platform.applyCommandOptions(argv);
  webpackOverrides.push(cliAliases(platform.getAliases()));

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
  if (plugin && plugin.beforeBuild) {
    webpackOverrides.push(plugin.beforeBuild(argv));
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
  handler: buildCommand,
};
