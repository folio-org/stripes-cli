#!/usr/bin/env node

const yargs = require('yargs');
const updateNotifier = require('update-notifier');
const isInstalledGlobally = require('is-installed-globally');
const packageJson = require('../package.json');
const AliasError = require('./platform/alias-error');
const { yargsConfig, commandDirOptions } = require('./cli/config');
const logger = require('./cli/logger')();

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

// Monkey-patch Yargs to inform user of an unrecognized command when no suggestions could be provided
const validation = yargs.getValidationInstance();
const recommendCommands = validation.recommendCommands;
validation.recommendCommands = (command, ...rest) => {
  recommendCommands(command, ...rest);
  // We will only get here if yargs has not already exited with it's suggestions
  console.log(`Unknown command ${command}.`);
};

try {
  const argv = yargs.commandDir('./commands', commandDirOptions) // eslint-disable-line no-unused-vars, because yargs works this way
    .config(yargsConfig)
    .option('interactive', {
      describe: 'Enable interactive input (use --no-interactive to disable)',
      type: 'boolean',
      default: true,
    })
    .completion()
    .recommendCommands()
    .example('$0 <command> --help', 'View examples and options for a command')
    .demandCommand()
    .env('STRIPES')
    .scriptName('stripes')
    .help()
    .showHelpOnFail(false)
    .wrap(yargs.terminalWidth())
    .argv;
} catch (err) {
  if (err instanceof AliasError) {
    console.log(`Alias Error: ${err.message}`);
  } else {
    throw err;
  }
}
