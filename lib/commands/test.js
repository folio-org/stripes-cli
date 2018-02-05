const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../cli/main-handler');
const { applyOptions, serverOptions, okapiOptions, stripesConfigOptions } = importLazy('./common-options');
const nightmareCommand = importLazy('./test/nightmare').handler;
const karmaCommand = importLazy('./test/karma').handler;
const { commandDirOptions } = importLazy('../cli/config');

function testCommand(argv, context) {
  // Maintain backwards compatibility with original commands
  if (argv.type === 'unit') {
    karmaCommand(argv, context);
  } else {
    nightmareCommand(argv, context);
  }
}

module.exports = {
  command: 'test [configFile]',
  describe: 'Run the current app module\'s tests',
  builder: (yargs) => {
    yargs
      .commandDir('test', commandDirOptions)
      .option('type <type>', {
        describe: 'Type of tests to run',
        type: 'string',
        choices: ['e2e', 'unit'],
        default: 'e2e',
      })
      .example('$0 test nightmare --run=demo', 'Serve app and run it\'s demo.js Nightmare tests')
      .example('$0 test karma', 'Run Karma tests for the current app module');
    return applyOptions(yargs, Object.assign({}, serverOptions, okapiOptions, stripesConfigOptions));
  },
  handler: mainHandler(testCommand),
};
