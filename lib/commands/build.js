const context = require('../cli-context')();
const stripes = require('@folio/stripes-core/webpack/stripes-node-api');
const loadConfig = require('../load-config');
const { stripesConfigOptions } = require('./common-options');
const { processError, processStats, cliAppAlias, cliResolve } = require('../webpack-common');


function buildCommand(options) {
  console.log();
  const stripesConfig = loadConfig(options.configFile, context);

  options.webpackOverrides = [];
  options.webpackOverrides.push(cliResolve);
  if (context.type === 'app') {
    options.webpackOverrides.push(cliAppAlias);
  }

  // if (outputPath) {
  //   options.outputPath = outputPath;
  // }

  stripes.build(stripesConfig, options)
    .then(processStats)
    .catch(processError);
}

module.exports = {
  command: 'build',
  describe: 'Build a Stripes tenant bundle',
  builder: Object.assign({}, stripesConfigOptions, {
    configFile: {
      describe: 'File containing a Stripes tenant configuration.',
      type: 'string',
    },
    outputPath: {
      describe: 'Directory to place build output.',
      type: 'string',
      default: 'output',
    },
  }),
  handler: buildCommand,
};
