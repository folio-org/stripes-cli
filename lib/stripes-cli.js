#!/usr/bin/env node

import path from 'path';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import isInstalledGlobally from 'is-installed-globally';
import fs from 'fs-extra';

import AliasError from './platform/alias-error.js';
import cliConfig from './cli/config.js';
import getLogger from './cli/logger.js';

const { yargsConfig, commandDirOptions } = cliConfig;

const pkgPath = path.join(import.meta.dirname, '..', 'package.json');
const packageJson = fs.readJsonSync(pkgPath, { throws: false });
const logger = getLogger();

process.title = 'stripes-cli';
logger.log('stripes-cli', packageJson.version);

// update-notifier is pure ESM so needs to be loaded via dynamic import
// until we refactor from CJS to ESM. Until then, say hello to our old
// friend, the IIFE.
(async () => {
  // Update notifier runs async in a child process
  const updateNotifier = await import('update-notifier');
  updateNotifier.default({
    pkg: packageJson,
    updateCheckInterval: 1000 * 60 * 60 * 24 * 7,
  }).notify({
    isGlobal: isInstalledGlobally,
    // TODO: Consider reverting to default message once update-notifier detects global yarn installs
    message: 'Update available - Refer to README.md:\nhttps://github.com/folio-org/stripes-cli',
  });
})();

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
