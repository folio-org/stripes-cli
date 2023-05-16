const importLazy = require('import-lazy')(require);

const { contextMiddleware } = importLazy('../../cli/context-middleware');
const path = importLazy('path');
const fs = importLazy('fs');
const { rimraf } = importLazy('rimraf');
const DevelopmentEnvironment = importLazy('../../environment/development');

function removeFileOrFolder(dir, fileOrFolderName) {
  const nodeModules = path.resolve(dir, fileOrFolderName);
  if (fs.existsSync(nodeModules)) {
    return rimraf(nodeModules)
      .then(() => {
        console.log(`Cleaned "${nodeModules}`);
      })
      .catch(() => {
        console.error(`Error cleaning "${nodeModules}"`, err);
      });
  } else {
    console.log(`Not found "${nodeModules}`);
    return Promise.resolve;
  }
}

function cleanCommand(argv) {
  const context = argv.context;
  if (!context.isWorkspace && !context.isPlatform) {
    console.log('This command must be run from a platform or workspace context');
    return Promise.resolve();
  }

  const dev = new DevelopmentEnvironment(context.cwd, context.isWorkspace);
  dev.loadExistingModules();
  const moduleDirs = dev.getModulePaths();

  console.log(`Cleaning ${moduleDirs.length} directories ...`);

  if (argv.removeLock) {
    console.log(`Removing ${moduleDirs.length} yarn.lock file(s) ...`);
  }

  const clean = [];
  moduleDirs.forEach((dir) => {
    clean.push(removeFileOrFolder(dir, 'node_modules'));

    if (argv.removeLock) {
      clean.push(removeFileOrFolder(dir, 'yarn.lock'));
    }
  });

  return Promise.all(clean)
    .then(() => {
      if (argv.install) {
        console.log('Installing dependencies ...');
        return dev.installDependencies();
      } else {
        return Promise.resolve();
      }
    })
    .then(() => {
      console.log('Done.');
    });
}

module.exports = {
  command: 'clean',
  describe: 'Remove node_modules for active platform, workspace, and aliases',
  builder: (yargs) => {
    yargs.middleware([
      contextMiddleware(),
    ]);
    yargs.option('install', {
      describe: 'Install dependencies after cleaning',
      type: 'boolean',
      default: false,
    });
    yargs.option('removeLock', {
      describe: 'Remove yarn.lock file(s) after cleaning',
      type: 'boolean',
      default: false,
    });
    yargs
      .example('$0 platform clean --install', 'Clean and reinstall dependencies')
      .example('$0 platform clean --removeLock', 'Clean and remove yarn.lock file(s)')
      .example('$0 platform clean', 'Clean only');
    return yargs;
  },
  handler: cleanCommand,
};
