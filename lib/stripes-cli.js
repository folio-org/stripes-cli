#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const isInstalledGlobally = require('is-installed-globally');
const packageJson = require('../package');
const AliasError = require('./platform/alias-error');
const { yargsConfig, commandDirOptions } = require('./cli/config');
const logger = require('./cli/logger')();

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
