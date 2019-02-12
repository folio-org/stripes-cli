const findUp = require('find-up');
const fs = require('fs');
const logger = require('./logger')();

// Maintain backwards compatibility for plugins referencing previous commands
const pluginMap = {
  karma: 'test', // previously "test --type=unit"
};

// Add support for custom configs
// TODO: Perform some validation of the config
logger.log('loading CLI config...');
let cliConfig = {};
const configPath = findUp.sync(['.stripesclirc.js', '.stripesclirc.json', '.stripesclirc']);
if (configPath) {
  if (configPath.endsWith('.js')) {
    cliConfig = require(configPath); // eslint-disable-line
  } else {
    cliConfig = JSON.parse(fs.readFileSync(configPath));
  }
  logger.log('loaded', configPath);
} else {
  logger.log('no CLI config found');
}

// Inject CLI plugin options to an existing command
function applyCommandPlugin(command, pathToFile, filename) {
  if (!cliConfig.plugins) {
    return command;
  }

  // TODO: Match against command name (currently checking filename)
  const commandName = filename.replace('.js', '');
  const plugin = cliConfig.plugins[commandName] || cliConfig.plugins[pluginMap[commandName]];

  if (plugin) {
    // TODO: Validate options
    const originalBuilder = command.builder;
    const originalHandler = command.handler;
    const pluginOptions = plugin.options;

    // Inject options to display in CLI help
    if (plugin.options && typeof plugin.options === 'object') {
      logger.log('plugin options found for', command);
      command.builder = (y) => {
        y.options(pluginOptions);
        return originalBuilder(y);
      };
    }
    // Inject CLI hooks (currently only beforeBuild)
    if (plugin.beforeBuild && typeof plugin.beforeBuild === 'function') {
      logger.log('plugin beforeBuild found for', command);
      command.handler = args => originalHandler(args, { plugin: { beforeBuild: plugin.beforeBuild } });
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
  aliases: cliConfig.aliases,
};
