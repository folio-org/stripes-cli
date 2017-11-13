const context = require('../cli-context');
const stripes = require('@folio/stripes-core/webpack/stripes-node-api');
const loadConfig = require('../load-config');
const { applyOptions, stripesConfigOptions, buildOptions } = require('./common-options');
const { processError, processStats, cliAppAlias, cliResolve } = require('../webpack-common');


function buildCommand(argv) {
  if (argv.dev) {
    console.log('Development config not yet implemented with serve');
    return;
  }

  const stripesConfig = loadConfig(argv.config, context);

  argv.webpackOverrides = [];
  argv.webpackOverrides.push(cliResolve);
  if (context.type === 'app') {
    argv.webpackOverrides.push(cliAppAlias);
  }

  // TODO: check for platform context and add platform aliases

  // TODO: add --analyze option and add plugin, warn if used with aliased apps

  if (argv.output) {
    argv.outputPath = argv.output;
  }

  console.log('Building...');
  stripes.build(stripesConfig, argv)
    .then(processStats)
    .catch(processError);
}

module.exports = {
  command: 'build [config] [outputPath]',
  describe: 'Build a Stripes tenant bundle',
  builder: (yargs) => {
    yargs
      .positional('config', {
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
      .example('$0 build stripes.config.js dir', 'Platform context build')
      .example('$0 build --output=dir', 'App context build using virtual platform');
    return applyOptions(yargs, Object.assign({}, stripesConfigOptions, buildOptions));
  },
  handler: buildCommand,
};
