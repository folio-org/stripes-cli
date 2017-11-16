#!/usr/bin/env node

const yargs = require('yargs');
const updateNotifier = require('update-notifier');
const packageJson = require('../package.json');
const context = require('./cli-context');
const { AliasError } = require('./platform/alias-validation');

process.title = 'stripes-cli';

// Update notifier runs async in a child process
updateNotifier({
  pkg: packageJson,
  updateCheckInterval: 1000 * 60 * 60 * 24 * 1, // TODO: Reduce frequency after v1
}).notify({
  isGlobal: context.isGlobalCli,
});

console.log(`\nstripes-cli ${packageJson.version}\n`);

try {
  const argv = yargs.commandDir('./commands')
    .example('$0 <command> --help', 'View examples and options for a command')
    .demandCommand()
    .help()
    .argv;
} catch (err) {
  if (err instanceof AliasError) {
    console.log(`Alias Error: ${err.message}`);
  } else {
    throw err;
  }
}
