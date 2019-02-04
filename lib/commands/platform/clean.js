const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const path = importLazy('path');
const fs = importLazy('fs');
const rimraf = importLazy('rimraf');
const DevelopmentEnvironment = importLazy('../../environment/development');

function cleanNodeModules(dir) {
  return new Promise((resolve) => {
    const nodeModules = path.resolve(dir, 'node_modules');
    if (fs.existsSync(nodeModules)) {
      rimraf(nodeModules, {}, (err) => {
        if (err) {
          console.error(`Error cleaning "${nodeModules}"`, err);
        } else {
          console.log(`Cleaned "${nodeModules}`);
        }
        resolve();
      });
    } else {
      console.log(`Not found "${nodeModules}`);
      resolve();
    }
  });
}

function cleanCommand(argv, context) {
  if (!context.isWorkspace && !context.isPlatform) {
    console.log('This command must be run from a platform or workspace context');
    return Promise.resolve();
  }

  const dev = new DevelopmentEnvironment(context.cwd, context.isWorkspace);
  dev.loadExistingModules();
  const moduleDirs = dev.getModulePaths();

  console.log(`Cleaning ${moduleDirs.length} directories ...`);

  const clean = [];
  moduleDirs.forEach((dir) => {
    clean.push(cleanNodeModules(dir));
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
    yargs.option('install', {
      describe: 'Install dependencies after cleaning',
      type: 'boolean',
      default: false,
    });
    yargs
      .example('$0 platform clean --install', 'Clean and reinstall dependencies')
      .example('$0 platform clean', 'Clean only');
    return yargs;
  },
  handler: mainHandler(cleanCommand),
};
