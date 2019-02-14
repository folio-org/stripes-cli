const importLazy = require('import-lazy')(require);

const { contextMiddleware } = importLazy('../cli/context-middleware');
const { stripesConfigMiddleware } = importLazy('../cli/stripes-config-middleware');
const { serverOptions, okapiOptions, stripesConfigFile, stripesConfigStdin, stripesConfigOptions } = importLazy('./common-options');
const nightmareCommand = importLazy('./test/nightmare').handler;
const karmaCommand = importLazy('./test/karma').handler;
const { commandDirOptions } = importLazy('../cli/config');

function testCommand(argv) {
  // Maintain backwards compatibility with original commands
  if (argv.type === 'unit') {
    karmaCommand(argv);
  } else {
    nightmareCommand(argv);
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
      .options(Object.assign({}, serverOptions, okapiOptions, stripesConfigStdin, stripesConfigOptions))
      .example('$0 test nightmare --run=demo', 'Serve app and run it\'s demo.js Nightmare tests')
      .example('$0 test karma', 'Run Karma tests for the current app module');
  },
  handler: testCommand,
};
