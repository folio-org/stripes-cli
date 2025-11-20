import { contextMiddleware } from '../../cli/context-middleware.js';
import bigtest from '../../test/setup-bigtest.js';
import yarn from '../../yarn.js';

function setupBigTestCommand(argv) {
  const context = argv.context;

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

export default {
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
