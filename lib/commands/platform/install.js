import contextMiddlewareMod from '../../cli/context-middleware.js';
import DevelopmentEnvironment from '../../environment/development.js';

const { contextMiddleware } = contextMiddlewareMod;

function installCommand(argv) {
  const context = argv.context;
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

export default {
  command: 'install',
  describe: 'Install platform or workspace dependencies including aliases',
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
