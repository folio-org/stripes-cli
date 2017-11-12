#!/usr/bin/env node

const yargs = require('yargs');
const updateNotifier = require('update-notifier');
const packageJson = require('../package.json');
const context = require('./cli-context')();

process.title = 'stripes-cli';

// Update notifier runs async in a child process
updateNotifier({
  pkg: packageJson,
  updateCheckInterval: 1000 * 60 * 60 * 24 * 1, // TODO: Reduce frequency after v1
}).notify({
  isGlobal: context.isGlobalCli,
});

console.log(`\nstripes-cli ${packageJson.version}`);
console.log(`context: ${context.type}; name: ${context.moduleName}; running: ${context.isGlobalCli ? 'globally' : 'locally'}`);

const argv = yargs.commandDir('./commands')
  .demandCommand()
  .help()
  .argv;
