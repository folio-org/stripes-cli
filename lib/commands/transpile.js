const importLazy = require('import-lazy')(require);

const { contextMiddleware } = importLazy('../cli/context-middleware');
const StripesCore = importLazy('../cli/stripes-core');
const StripesPlatform = importLazy('../platform/stripes-platform');
const { stripesConfigFile } = importLazy('./common-options');
const { processError, processStats } = importLazy('../webpack-common');

let _stripesPlatform;
let _stripesCore;

// stripesPlatform and stripesCore overrides primarily used as injection for unit tests
function stripesOverrides(stripesPlatform, stripesCore) {
  _stripesPlatform = stripesPlatform;
  _stripesCore = stripesCore;
}

function transpileCommand(argv) {
  const context = argv.context;
  // Default transpile command to production env
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }

  const platform = _stripesPlatform || new StripesPlatform(argv.stripesConfig, context, argv);
  const webpackOverrides = platform.getWebpackOverrides(context);

  console.log('Transpiling...');
  const stripes = _stripesCore || new StripesCore(context, platform.aliases);
  stripes.api.transpile(Object.assign({}, argv, { webpackOverrides }))
    .then(processStats)
    .catch(processError);
}

module.exports = {
  command: 'transpile',
  describe: 'Transpile single module',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
      ])
      .positional('configFile', stripesConfigFile.configFile)
      .example('$0 transpile', 'Transpile a module');
  },
  handler: transpileCommand,
  stripesOverrides,
};
