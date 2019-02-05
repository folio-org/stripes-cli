const importLazy = require('import-lazy')(require);

const { contextMiddleware } = importLazy('../../cli/context-middleware');
const bigtest = importLazy('../../test/setup-bigtest');
const yarn = importLazy('../../yarn');

function setupBigTestCommand(argv) {
  const context = argv.cliContext;

  if (!context.isUiModule) {
    console.log('"app bigtest" only works in the APP context');
    return Promise.resolve();
  }

  console.log('Setting up BigTest...');
  return bigtest.setupBigTest()
    .then(() => {
      if (argv.install) {
        console.log('Installing dependencies...');
        return yarn.add(context.cwd, bigtest.packages, true);
      } else {
        return { isInstalled: false };
      }
    })
    .then(() => {
      console.log('"stripes test karma" to run your tests');
    });
}

module.exports = {
  command: 'bigtest',
  describe: 'Setup BigTest for the current app',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
      ])
      .option('install', {
        describe: 'Yarn add dependencies',
        type: 'boolean',
        default: true,
      })
      .example('$0 app bigtest', 'Setup BigTest for the current app, and add dependencies')
      .example('$0 app bigtest --no-install', 'Setup BigTest for the current app, but do not add dependencies');
    return yargs;
  },
  handler: setupBigTestCommand,
};
