import path from 'path';
import loadCommands from '../cli/load-commands.js';
import contextMiddlewareMod from '../cli/context-middleware.js';
import stripesConfigMiddlewareMod from '../cli/stripes-config-middleware.js';
import commonOptionsMod from './common-options.js';
import karmaMod from './test/karma.js';
import configMod from '../cli/config.js';

const { contextMiddleware } = contextMiddlewareMod;
const { stripesConfigMiddleware } = stripesConfigMiddlewareMod;
const { serverOptions, okapiOptions, stripesConfigFile, stripesConfigOptions } = commonOptionsMod;
const karmaCommand = karmaMod.handler;
const { commandDirOptions } = configMod;

const subcommands = await loadCommands(path.join(import.meta.dirname, 'test'), commandDirOptions);

function testCommand(argv) {
  // Maintain backwards compatibility with original commands
  if (argv.type === 'unit') {
    karmaCommand(argv);
  }
}

export default {
  command: 'test',
  describe: 'Run the current app module\'s tests',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
        stripesConfigMiddleware(true)
      ])
      .command(subcommands)
      .positional('configFile', stripesConfigFile.configFile)
      .options(Object.assign({}, serverOptions, okapiOptions, stripesConfigOptions))
      .example('$0 test karma', 'Run Karma tests for the current app module');
  },
  handler: testCommand,
};
