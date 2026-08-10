#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const packageJson = require('../package');
const AliasError = require('./platform/alias-error');
const { yargsConfig, commandDirOptions } = require('./cli/config');
const logger = require('./cli/logger')();
const UpdateChecker = require('./cli/update-checker');

process.title = 'stripes-cli';
logger.log('stripes-cli', packageJson.version);

new UpdateChecker(packageJson).check();

try {
  yargs(hideBin(process.argv))
    .commandDir('./commands', commandDirOptions) // NOSONAR
    .config(yargsConfig)
    .option('interactive', {
      describe: 'Enable interactive input (use --no-interactive to disable)',
      type: 'boolean',
      default: true,
      hidden: true,
    })
    .completion()
    .recommendCommands()
    .example('$0 <command> --help', 'View examples and options for a command')
    .demandCommand()
    .env('STRIPES')
    .scriptName('stripes')
    .help()
    .showHelpOnFail(false)
    .wrap(yargs().terminalWidth())
    .parse();
} catch (err) {
  if (err instanceof AliasError) {
    console.error(`Alias Error: ${err.message}`);
  } else {
    throw err;
  }
}
