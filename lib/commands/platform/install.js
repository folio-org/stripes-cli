const importLazy = require('import-lazy')(require);

const { contextMiddleware } = importLazy('../../cli/context-middleware');
const DevelopmentEnvironment = importLazy('../../environment/development');


function installCommand(argv) {
  const context = argv.cliContext;
  if (!context.isWorkspace && !context.isPlatform) {
    console.log('This command must be run from a platform or workspace context');
    return Promise.resolve();
  }

  const dev = new DevelopmentEnvironment(context.cwd, context.isWorkspace);
  dev.loadExistingModules();

  return dev.installDependencies()
    .then(() => {
      console.log('Done.');
    });
}

module.exports = {
  command: 'install',
  describe: 'Yarn install platform or workspace dependencies including aliases',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
      ])
      .example('$0 platform install', '');
    return yargs;
  },
  handler: installCommand,
};
