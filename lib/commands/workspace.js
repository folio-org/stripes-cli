const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../cli/main-handler');
const path = importLazy('path');
const inquirer = importLazy('inquirer');
const DevelopmentEnvironment = importLazy('../environment/development');
const { platforms, uiModules, stripesModules, otherModules, allModules } = importLazy('../environment/inventory');
const { promptHandler } = importLazy('../cli/questions');


function workspaceCommand(argv, context) {
  console.log(argv.default);

  if (context.type !== 'empty') {
    console.log('Current directory has a package.json');
    return Promise.resolve();
  }

  if (!argv.modules) {
    console.log('No modules specified.');
    return Promise.resolve();
  }

  const unknownModules = argv.modules.filter(mod => !allModules.includes(mod));
  if (unknownModules.length) {
    console.log('The following modules are unknown:', unknownModules);
    return Promise.resolve();
  }

  const targetDir = path.resolve(context.cwd, argv.dir);
  const dev = new DevelopmentEnvironment(targetDir, true);
  dev.selectNewModules(argv.modules);

  return new Promise((resolve) => {
    // Create a directory
    dev.createDirectory(argv.default)
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
          console.log('\nInitializing Stripes configuration...');
          return dev.initializeStripesConfig().then(() => console.log(' Configuration complete.'));
        }
        return Promise.resolve();
      })

      // Report
      .then(() => {
        console.log('\nDone.');
        console.log(`\nEdit "${path.join(argv.dir, '.stripesclirc.json')}" to modify CLI configuration including aliases for this workspace.`);

        if (argv.clone) {
          const platformDirs = dev.validModules.filter(mod => platforms.includes(mod));
          if (platformDirs.length) {
            console.log(`\nPlatforms available: "${platformDirs.join('", "')}"`);
            console.log('  "cd" into the above dir(s) and run "stripes serve" to start.');
            console.log('  Edit "stripes.config.js.local" to turn modules on or off.');
          }
          const uiMods = dev.validModules.filter(mod => uiModules.includes(mod));
          if (uiMods.length) {
            console.log(`\nUI modules available: "${uiMods.join('", "')}"`);
            console.log('  "cd" into the above dir(s) and run "stripes serve" to start a module in isolation.');
          }
        } else {
          console.log(`Warning: New "${argv.dir}" workspace has no modules because of "--no-clone" option.`);
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
      choices: [new inquirer.Separator('--- UI Modules ---')]
        .concat(uiModules)
        .concat([new inquirer.Separator('--- Stripes Modules ---')])
        .concat(stripesModules)
        .concat([new inquirer.Separator('--- Platforms ---')])
        .concat(platforms)
        .concat([new inquirer.Separator('--- Other ---')])
        .concat(otherModules),
    },
  },
};

module.exports = {
  command: 'workspace',
  describe: 'Create a Yarn workspace for Stripes development, select modules, clone, and install.',
  builder: (yargs) => {
    yargs.option('dir', {
      describe: 'Directory to create',
      type: 'string',
      default: 'stripes',
    });
    yargs.option('modules', options.modules);
    yargs.option('default.okapi', {
      describe: 'Default Okapi URL for CLI config ',
      type: 'string',
      default: 'http://localhost:9130',
    });
    yargs.option('default.tenant', {
      describe: 'Default tenant for CLI config',
      type: 'string',
      default: 'diku',
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
      .example('$0 workspace', 'Create a "stripes" dir and prompt for modules')
      .example('$0 workspace temp', 'Create an "temp" dir and prompt for modules')
      .example('$0 workspace --modules ui-users stripes-core', 'Create and select ui-users and stripes-core')
      .example('$0 workspace --modules all', 'Create and select all available modules')
      .example('$0 workspace --no-install', 'Create without a installing dependencies');
    return yargs;
  },
  handler: mainHandler(promptHandler({
    modules: options.modules,
  }, workspaceCommand)),
};
