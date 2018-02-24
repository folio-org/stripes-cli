const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const path = importLazy('path');
const DevelopmentEnvironment = importLazy('../../environment/development');
const { allModules, uiModules } = importLazy('../../environment/inventory');
const { promptHandler } = importLazy('../../cli/questions');


function devPlatformCommand(argv, context) {
  if (context.type !== 'empty') {
    console.log('Current directory has a package.json');
    return Promise.resolve();
  }

  if (!argv.modules) {
    console.log('No modules specified.');
    return Promise.resolve();
  }

  const targetDir = path.resolve(context.cwd, argv.name);
  const dev = new DevelopmentEnvironment(targetDir, argv.modules, argv.workspace);
  return new Promise((resolve) => {
    // Create a directory
    console.log('Creating directory...');
    dev.createDirectory()
      .then(() => {
        console.log(`  Directory "${targetDir}" created.`);
      })

      // Clone the modules!
      .then(() => {
        if (argv.clone) {
          console.log('\nCloning modules...');
          return dev.cloneRepositories().then(() => console.log(' Clone complete.'));
        } else {
          console.log('\nOption "--no-clone" provided. No repositories cloned. Aliases will not be configured.');
        }
        return Promise.resolve();
      })

      // Install them!
      .then(() => {
        if (argv.install) {
          console.log('\nInstalling dependencies...');
          return dev.installDependencies().then(() => console.log(' Install complete.'));
        } else {
          console.log('\nOption "--no-install" provided. Please manually "yarn install" dependencies.');
        }
        return Promise.resolve();
      })

      // Initialize configs
      .then(() => {
        if (argv.clone) {
          console.log('\nInitializing configuration...');
          return dev.initializeStripesConfig().then(() => dev.initializeCliConfig()).then(() => console.log(' Configuration complete.'));
        }
        return Promise.resolve();
      })

      // Report
      .then(() => {
        console.log('\nDone.');

        if (argv.clone) {
          dev.platformDirs.forEach((dir) => {
            console.log(`\nPlatform configured: "${path.join(argv.name, dir)}"`);
            console.log('  "cd" into the above directory and run "stripes serve" to start.');
            console.log(`  Edit "${path.join(dir, 'stripes.config.js.local')}" to turn modules on or off.`);
            console.log(`  Edit "${path.join(dir, '.stripesclirc.json')}" to modify aliases and CLI configuration.`);
          });

          const uiMods = dev.validModules.filter(mod => uiModules.includes(mod));
          if (uiMods.length) {
            console.log(`\nUI modules available: "${uiMods.join('", "')}"`);
            console.log('  "cd" into the above dir(s) and run "stripes serve" to start a module in isolation.');
          }
        } else {
          console.log(`Warning: New "${argv.name}" directory has no modules because of "--no-clone" option.`);
        }
        resolve();
      })
      .catch((err) => {
        // TODO: Error handling...
        console.error('Something went wrong!', err);
      });
  });
}

// Defining the modules option separately, so we can pass it both to yargs and inquire (via promptHandler)
const options = {
  modules: {
    describe: 'Stripes modules to include',
    type: 'array',
    inquirer: {
      type: 'checkbox',
      choices: allModules,
    },
  },
};

module.exports = {
  command: 'create [name]',
  describe: 'Creates a new stripes development platform.',
  builder: (yargs) => {
    yargs.positional('name', {
      describe: 'Directory to create',
      type: 'string',
      default: 'stripes',
    });
    yargs.option('modules', options.modules);
    yargs.option('workspace', {
      describe: 'Create using Yarn Workspaces.',
      type: 'boolean',
      default: true,
    });
    yargs.option('clone', {
      describe: 'Clone the selected modules\'s repositories',
      type: 'boolean',
      default: true,
    });
    yargs.option('install', {
      describe: 'Install dependencies',
      type: 'boolean',
      default: true,
    });
    yargs
      .example('$0 platform create', 'Create a dev platform in a new "stripes" directory with a Yarn workspace.')
      .example('$0 platform create example', 'Create a dev platform in a new "example" directory')
      .example('$0 platform create --no-workspace', 'Create a dev platform without a Yarn workspace.')
      .example('$0 platform create --modules all', 'Create a dev platform with all available modules')
      .example('$0 platform create --modules ui-users stripes-components', 'Create a dev platform with just ui-users and stripes-components')
      .example('$0 platform create --no-install', 'Create a dev platform without a installing dependencies.');
    return yargs;
  },
  handler: mainHandler(promptHandler({
    modules: options.modules,
  }, devPlatformCommand)),
};
