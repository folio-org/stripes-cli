import contextMiddlewareMod from '../cli/context-middleware.js';
import StripesCore from '../cli/stripes-core.js';
import StripesPlatform from '../platform/stripes-platform.js';
import commonOptionsMod from './common-options.js';
import webpackCommonMod from '../webpack-common.js';

const { contextMiddleware } = contextMiddlewareMod;
const { stripesConfigFile } = commonOptionsMod;
const { processError, processStats } = webpackCommonMod;

let _stripesPlatform;
let _stripesCore;

// stripesPlatform and stripesCore overrides primarily used as injection for unit tests
function stripesOverrides(stripesPlatform, stripesCore) {
  _stripesPlatform = stripesPlatform;
  _stripesCore = stripesCore;
}

async function transpileCommand(argv) {
  const context = argv.context;
  // Default transpile command to production env
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }

  const platform = _stripesPlatform || new StripesPlatform(argv.stripesConfig, context, argv);
  const webpackOverrides = [];

  if (argv.analyze) {
    const { BundleAnalyzerPlugin } = await import('webpack-bundle-analyzer');
    webpackOverrides.push((config) => {
      config.plugins.push(new BundleAnalyzerPlugin());
      return config;
    });
  }

  console.info('Transpiling...');
  const stripes = _stripesCore || new StripesCore(context, platform.aliases);
  stripes.api.transpile(Object.assign({}, argv, { webpackOverrides }))
    .then(processStats)
    .catch(processError);
}

export default {
  command: 'transpile',
  describe: 'Transpile single module',
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
      .example('$0 transpile', 'Transpile a module');
  },
  handler: transpileCommand,
  stripesOverrides,
};
