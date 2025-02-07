import { contextMiddleware } from '../cli/context-middleware.js';
import { stripesConfigMiddleware } from '../cli/stripes-config-middleware.js';
import { serverOptions, okapiOptions, stripesConfigFile, stripesConfigOptions } from './common-options.js';
import cliConfig from '../cli/config.js';
import karma from './test/karma.js';

function testCommand(argv) {
  // Maintain backwards compatibility with original commands
  if (argv.type === 'unit') {
    karma.handler(argv);
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
      .commandDir('test', cliConfig.commandDirOptions)
      .positional('configFile', stripesConfigFile.configFile)
      .options(Object.assign({}, serverOptions, okapiOptions, stripesConfigOptions))
      .example('$0 test karma', 'Run Karma tests for the current app module');
  },
  handler: testCommand,
};
