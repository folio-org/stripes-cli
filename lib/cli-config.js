const findUp = require('find-up');
const fs = require('fs');
const { applyOptions } = require('./commands/common-options');

// Add support for custom configs
// TODO: Perform some validation of the config
let cliConfig = {};
const configPath = findUp.sync(['.stripesrc.js', '.stripesrc.json', '.stripesrc']);
if (configPath) {
  if (configPath.endsWith('.js')) {
    cliConfig = require(configPath); // eslint-disable-line
  } else {
    cliConfig = JSON.parse(fs.readFileSync(configPath));
  }
}

// Inject CLI plugin options to an existing command
function applyCommandPlugin(command, pathToFile, filename) {
  if (!cliConfig.plugins) {
    return command;
  }

  // TODO: Match against command name (currently checking filename)
  const commandName = filename.replace('.js', '');
  const plugin = cliConfig.plugins[commandName];

  if (plugin) {
    // TODO: Validate options
    const originalBuilder = command.builder;
    const originalHandler = command.handler;
    const pluginOptions = plugin.options;

    // Inject options to display in CLI help
    if (plugin.options && typeof plugin.options === 'object') {
      command.builder = (y) => {
        applyOptions(y, pluginOptions);
        return originalBuilder(y);
      };
    }
    // Inject CLI hooks (currently only beforeBuild)
    if (plugin.beforeBuild && typeof plugin.beforeBuild === 'function') {
      command.handler = args => originalHandler(args, { beforeBuild: plugin.beforeBuild });
    }
  }
  return command;
}

// Options for yargs.commandDir()
const commandDirOptions = cliConfig.plugins ? { visit: applyCommandPlugin } : {};

// Strip out plugins which are specific to Stripes CLI
const yargsConfig = Object.assign({}, cliConfig);
delete yargsConfig.plugins;

module.exports = {
  yargsConfig,
  commandDirOptions,
  configPath,
  plugins: cliConfig.plugins,
};
