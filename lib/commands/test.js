const importLazy = require('import-lazy')(require);

const { contextMiddleware } = importLazy('../cli/context-middleware');
const { stripesConfigMiddleware } = importLazy('../cli/stripes-config-middleware');
const { serverOptions, okapiOptions, stripesConfigFile, stripesConfigOptions } = importLazy('./common-options');
const playwrightCommand = importLazy('./test/playwright').handler;
const { commandDirOptions } = importLazy('../cli/config');

function testCommand(argv) {
  // Maintain backwards compatibility with original commands
  if (argv.type === 'unit') {
    playwrightCommand(argv);
  }
}

module.exports = {
  command: 'test',
  describe: 'Run the current app module\'s tests',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
        stripesConfigMiddleware(true)
      ])
      .commandDir('test', commandDirOptions)
      .positional('configFile', stripesConfigFile.configFile)
      .options(Object.assign({}, serverOptions, okapiOptions, stripesConfigOptions))
      .example('$0 test playwright', 'Run Playwright tests for the current app module');
  },
  handler: testCommand,
};
