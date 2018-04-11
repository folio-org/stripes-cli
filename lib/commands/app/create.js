const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const createApp = importLazy('../../create-app');
const yarn = importLazy('../../yarn');
const { promptHandler } = importLazy('../../cli/questions');
const addModCommand = importLazy('../mod/add');
const enableModCommand = importLazy('../mod/enable');
const assignPermCommand = importLazy('../perm/assign');

function createAppCommand(argv, context) {
  let appData;

  // TODO: Verify destination folder
  if (context.type !== 'empty') {
    console.log('Existing package.json found. Nothing created.');
    return;
  }

  console.log('Creating app...');
  createApp(argv.name, argv.desc)
    .then((data) => {
      appData = data;
      if (argv.install) {
        console.log('Installing dependencies...');
        return yarn.install(appData.appDir);
      } else {
        return { isInstalled: false, appDir: appData.appDir };
      }
    })
    .then((result) => {
      if (result.isInstalled) {
        console.log(`"cd ${result.appDir}" and then "stripes serve" to run your new app`);
      } else {
        console.log(`"cd ${result.appDir}", "yarn install", and then "stripes serve" to run your new app`);
      }
      return Promise.resolve();
    })
    .then(() => {
      if (argv.assign) {
        console.log('Pushing module descriptor to Okapi...');
        // Change working directory for remaining commands
        argv.workingDir = appData.appDir;
        return addModCommand.handler(argv)
          .then((response) => {
            if (response.success) {
              console.log(`Module descriptor ${response.id} added to Okapi`); // TODO: Duplicate message
            } else if (response.alreadyExists) {
              console.log(`Okapi already has a module with id ${response.id}. To force an update run "stripes mod update" from the app dir.`);
            }
            return Promise.resolve();
          })
          .then(() => enableModCommand.handler(argv))
          .then(() => {
            // Assign the new permission to a user
            argv.name = `module.${appData.appName}.enabled`;
            return assignPermCommand.handler(argv);
          })
          .then(() => {
            argv.name = `settings.${appData.appName}.enabled`;
            return assignPermCommand.handler(argv);
          });
      }
      return Promise.resolve();
    });
}

const appOptions = {
  name: {
    describe: 'Name of the app',
    type: 'string',
    group: 'App Options:',
  },
  desc: {
    describe: 'Description of the app',
    type: 'string',
    group: 'App Options:',
  },
};

module.exports = {
  command: 'create [name]',
  describe: 'Create a new Stripes app module',
  builder: (yargs) => {
    yargs
      .positional('name', appOptions.name)
      .option('desc', appOptions.desc)
      .option('install', {
        describe: 'Yarn install dependencies',
        type: 'boolean',
        default: true,
      })
      .option('assign', {
        describe: 'Assign new app permission to the given user (includes pushing module descriptor to Okapi and enabling for tenant)',
        type: 'string',
      })
      .example('$0 app create "Hello World"', 'Create new Stripes UI app, directory, and install dependencies')
      .example('$0 app create "Hello World" --assign diku_admin', 'Create app and assign permissions to user diku_admin')
      .example('$0 app create "Hello World" --no-install', 'Create new Stripes UI app, but do not install dependencies');
    return yargs;
  },
  handler: mainHandler(promptHandler(appOptions, createAppCommand)),
};
