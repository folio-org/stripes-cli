#!/usr/bin/env node

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';
import packageJson from '../package.json' with { type: 'json' };
import loadCommands from './cli/load-commands.js';
import AliasError from './platform/alias-error.js';
import configMod from './cli/config.js';
import loggerFactory from './cli/logger.js';
import UpdateChecker from './cli/update-checker.js';

const { yargsConfig, commandDirOptions } = configMod;
const logger = loggerFactory();

process.title = 'stripes-cli';
logger.log('stripes-cli', packageJson.version);

new UpdateChecker(packageJson).check();

try {
  yargs(hideBin(process.argv))
    .command(await loadCommands(path.join(import.meta.dirname, 'commands'), commandDirOptions))
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
