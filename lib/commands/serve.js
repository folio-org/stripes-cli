import childProcess from 'child_process';
import path from 'path';

import { contextMiddleware } from '../cli/context-middleware.js';
import { stripesConfigMiddleware } from '../cli/stripes-config-middleware.js';
import StripesCore from '../cli/stripes-core.js';
import StripesPlatform from '../platform/stripes-platform.js';
import { serverOptions, okapiOptions, stripesConfigFile, stripesConfigStdin, stripesConfigOptions, buildOptions } from './common-options.js';
import webpackCommon from '../webpack-common.js';
import { start } from '../server.js';

const { processError, emitLintWarnings, limitChunks, enableMirage, enableCoverage, ignoreCache } = { webpackCommon };

// stripes-core does not currently support publicPath with the dev server
const serveBuildOptions = Object.assign({}, buildOptions);
delete serveBuildOptions.publicPath;

function replaceArgvOkapiWithProxyURL(argv) {
  argv.okapi = `${argv.proxyHost}:${argv.proxyPort}`;

  if (argv.stripesConfig?.okapi) {
    argv.stripesConfig.okapi.url = argv.okapi;
  }
}

function serveCommand(argv) {
  const context = argv.context;
  // Default serve command to development env
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }

  // When a directory is provided, there is nothing to build
  if (argv.existingBuild) {
    console.log('Serving an existing build...');
    start(argv.existingBuild, argv);
    return;
  }

  if (!(context.isUiModule || context.isStripesModule || context.isPlatform)) {
    console.warn('Please check that you are in the correct directory!\n"serve" should be run from an app or platform context.\n');
  }

  if (context.isPlatform && !argv.stripesConfig) {
    console.warn('Warning: Serving a platform without a stripes configuration.  Did you forget to include "stripes.config.js"?');
  }

  if (argv.prod) {
    console.log('Production config not yet implemented with serve');
    return;
  }

  if (argv.startProxy) {
    console.info('starting proxy');
    childProcess.fork(path.resolve(context.cliRoot, './lib/run-proxy.js'), [argv.okapi, argv.port, argv.proxyHost, argv.proxyPort]);
    // if we're using a proxy server - we need to pass the proxy host as okapi to Stripes platform
    replaceArgvOkapiWithProxyURL(argv);
  }

  const platform = new StripesPlatform(argv.stripesConfig, context, argv);

  const webpackOverrides = platform.getWebpackOverrides(context);

  if (argv.lint) {
    webpackOverrides.push(emitLintWarnings);
  }

  if (argv.maxChunks) {
    webpackOverrides.push(limitChunks(argv.maxChunks));
  }

  if (argv.cache === false) {
    webpackOverrides.push(ignoreCache);
  }


  if (argv.mirage) {
    console.info('Using Mirage server');
    webpackOverrides.push(enableMirage(argv.mirage));
  }

  if (context.plugin && context.plugin.beforeBuild) {
    webpackOverrides.push(context.plugin.beforeBuild(argv));
  }

  if (argv.coverage) {
    webpackOverrides.push(enableCoverage);
  }

  console.log('Waiting for webpack to build...');
  const stripes = new StripesCore(context, platform.aliases);
  stripes.api.serve(platform.getStripesConfig(), Object.assign({}, argv, { webpackOverrides }))
    .catch(processError);
}

export default {
  command: 'serve [configFile]',
  aliases: ['dev'],
  describe: 'Serve up a development build of Stripes',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
        stripesConfigMiddleware(),
      ])
      .positional('configFile', stripesConfigFile.configFile)
      .option('existing-build', {
        describe: 'Serve an existing build from the supplied directory',
        type: 'string',
        conflicts: 'configFile',
      })
      .option('mirage [scenario]', {
        describe: 'Enable Mirage Server when available and optionally specify a scenario',
        type: 'string',
      })
      .option('coverage', {
        describe: 'Enable coverage generation',
        type: 'boolean',
      })
      .options(Object.assign({}, serverOptions, okapiOptions, stripesConfigStdin, stripesConfigOptions, serveBuildOptions))
      .example('$0 serve --hasAllPerms', 'Serve an app (in app context) with permissions flag set for development')
      .example('$0 serve stripes.config.js', 'Serve a platform defined by the supplied configuration')
      .example('$0 serve --existing-build output', 'Serve a build previously created with "stripes build"')
      .example('$0 serve --mirage', 'Serve an app (in app context) with a mock backend server"');
  },
  handler: serveCommand,
};
