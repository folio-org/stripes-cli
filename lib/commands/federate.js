const importLazy = require('import-lazy')(require);

const { contextMiddleware } = importLazy('../cli/context-middleware');
const StripesCore = importLazy('../cli/stripes-core');
const StripesPlatform = importLazy('../platform/stripes-platform');
const { stripesConfigFile } = importLazy('./common-options');

let _stripesPlatform;
let _stripesCore;

// stripesPlatform and stripesCore overrides primarily used as injection for unit tests
function stripesOverrides(stripesPlatform, stripesCore) {
  _stripesPlatform = stripesPlatform;
  _stripesCore = stripesCore;
}

function federateCommand(argv) {
  const context = argv.context;
  // Default federate command to production env
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }

  const platform = _stripesPlatform || new StripesPlatform(argv.stripesConfig, context, argv);
  const webpackOverrides = [];

  if (argv.analyze) {
    const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin; // eslint-disable-line
    webpackOverrides.push((config) => {
      config.plugins.push(new BundleAnalyzerPlugin());
      return config;
    });
  }

  console.info('Federate module...');
  const stripes = _stripesCore || new StripesCore(context, platform.aliases);
  stripes.api.federate(Object.assign({}, argv, { webpackOverrides }));
}

module.exports = {
  command: 'federate',
  describe: 'federate single module',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
      ])
      .positional('configFile', stripesConfigFile.configFile)
      .option('analyze', {
        describe: 'Run the Webpack Bundle Analyzer after build (launches in browser)',
        type: 'boolean',
      })
      .option('port', {
        describe: 'A port which will be used for the remote federated module',
        type: 'number',
      })
      .example('$0 federate', 'federate a module');
  },
  handler: federateCommand,
  stripesOverrides,
};
