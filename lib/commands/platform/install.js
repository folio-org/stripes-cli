const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const DevelopmentEnvironment = importLazy('../../environment/development');


function installCommand(argv, context) {
  if (context.type !== 'workspace' && context.type !== 'platform') {
    console.log('This command must be run from a platform or workspace context');
    return Promise.resolve();
  }

  const dev = new DevelopmentEnvironment(context.cwd, context.type === 'workspace');
  dev.loadExistingModules();

  return dev.installDependencies()
    .then(() => {
      console.log('Done.');
    });
}

module.exports = {
  command: 'install',
  describe: 'Yarn install workspace or platform dependencies with aliases',
  builder: (yargs) => {
    yargs
      .example('$0 platform install', '');
    return yargs;
  },
  handler: mainHandler(installCommand),
};
