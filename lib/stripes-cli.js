#!/usr/bin/env node

const yargs = require('yargs');
const updateNotifier = require('update-notifier');
const packageJson = require('../package.json');
const context = require('./cli-context');
const { AliasError } = require('./platform/alias-validation');
const findUp = require('find-up');
const fs = require('fs');
const { applyOptions } = require('./commands/common-options');

process.title = 'stripes-cli';

// Update notifier runs async in a child process
updateNotifier({
  pkg: packageJson,
  updateCheckInterval: 1000 * 60 * 60 * 24 * 1, // TODO: Reduce frequency after v1
}).notify({
  isGlobal: context.isGlobalCli,
});

console.log(`\nstripes-cli ${packageJson.version}\n`);

// Add support for custom configs
// TODO: Perform some validation of the config
let cliConfig = {};
const configPath = findUp.sync(['.stripesclirc.js', '.stripesclirc.json', '.stripesclirc']);
if (configPath) {
  if (configPath.endsWith('.js')) {
    cliConfig = require(configPath); // eslint-disable-line
  } else {
    cliConfig = JSON.parse(fs.readFileSync(configPath));
  }
}

const pluginKeys = Object.getOwnPropertyNames(cliConfig.plugins || {});

// Inject CLI plugin options to an existing command
function applyCommandPlugin(command, pathToFile, filename) {
  const pluginIndex = pluginKeys.findIndex(key => `${key}.js` === filename);
  if (pluginIndex > -1) {
    // TODO: Validate options
    const plugin = cliConfig.plugins[pluginKeys[pluginIndex]];
    console.log(`Applying plugin to command ${filename}`);
    const originalBuilder = command.builder;
    const originalHandler = command.handler;
    const pluginOptions = plugin.options;
    command.builder = (y) => {
      applyOptions(y, pluginOptions);
      return originalBuilder(y);
    };
    if (plugin.beforeBuild) {
      command.handler = (args) => {
        args.beforeBuild = plugin.beforeBuild;
        return originalHandler(args);
      };
    }
  }
  return command;
}

const commandDirOptions = pluginKeys ? { visit: applyCommandPlugin } : {};

// Strip out plugins which are specific to Stripes CLI
const yargsConfig = Object.assign({}, cliConfig);
delete yargsConfig.plugins;

try {
  const argv = yargs.commandDir('./commands', commandDirOptions)
    .config(yargsConfig)
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
