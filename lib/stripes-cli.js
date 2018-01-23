#!/usr/bin/env node

const yargs = require('yargs');
const path = require('path');
const updateNotifier = require('update-notifier');
const packageJson = require('../package.json');
const { isGlobal } = require('./cli/context');
const { AliasError } = require('./platform/alias-validation');
const { yargsConfig, commandDirOptions } = require('./cli/config');
const OkapiError = require('./okapi/okapi-error');

process.title = 'stripes-cli';

// Update notifier runs async in a child process
updateNotifier({
  pkg: packageJson,
  updateCheckInterval: 1000 * 60 * 60 * 24 * 1, // TODO: Reduce frequency after v1
}).notify({
  isGlobal: isGlobal(path.resolve()),
});

console.log(`\nstripes-cli ${packageJson.version}\n`);

try {
  const argv = yargs.commandDir('./commands', commandDirOptions)
    .config(yargsConfig)
    .option('interactive', {
      describe: 'Enable interactive input (use --no-interactive to disable)',
      type: 'boolean',
      default: true,
    })
    .example('$0 <command> --help', 'View examples and options for a command')
    .demandCommand()
    .env('STRIPES')
    .help()
    .wrap(yargs.terminalWidth())
    .argv;
} catch (err) {
  if (err instanceof AliasError) {
    console.log(`Alias Error: ${err.message}`);
  } else {
    throw err;
  }
}
