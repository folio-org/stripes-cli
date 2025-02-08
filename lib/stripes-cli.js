#!/usr/bin/env node

import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import isInstalledGlobally from 'is-installed-globally';
import updateNotifier from 'update-notifier';

import fs from 'fs-extra';

import AliasError from './platform/alias-error.js';
import cliConfig from './cli/config.js';
import getLogger from './cli/logger.js';
import { commands } from './commands/index.js';

const { yargsConfig, commandDirOptions } = cliConfig;

const pkgPath = path.join(import.meta.dirname, '..', 'package.json');
const packageJson = fs.readJsonSync(pkgPath, { throws: false });
const logger = getLogger();

process.title = 'stripes-cli';
logger.log('stripes-cli', packageJson.version);

// Update notifier runs async in a child process
updateNotifier({
  pkg: packageJson,
  updateCheckInterval: 1000 * 60 * 60 * 24 * 7,
}).notify({
  isGlobal: isInstalledGlobally,
  // TODO: Consider reverting to default message once update-notifier detects global yarn installs
  message: 'Update available - Refer to README.md:\nhttps://github.com/folio-org/stripes-cli',
});

try {
  yargs(hideBin(process.argv))
    .command(commands)
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
