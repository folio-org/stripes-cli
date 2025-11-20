import path from 'path';

import { contextMiddleware, applyContext } from '../../cli/context-middleware.js';
import createApp from '../../create-app.js';
import yarn from '../../yarn.js';
import { promptMiddleware } from '../../cli/prompt-middleware.js';
import addModCommand from '../mod/add.js';
import enableModCommand from '../mod/enable.js';
import assignPermCommand from '../perm/assign.js';

function createAppCommand(argv) {
  const context = argv.context;
  let appData;
  const isWorkspace = context.isWorkspace;

  // TODO: Verify destination folder
  if (!context.isEmpty && !isWorkspace) {
    console.log('Existing package.json found. Nothing created.');
    return Promise.resolve();
  }

  console.log('Creating app...');
  return createApp.createApp(argv.name, argv.desc)
    .then((data) => {
      appData = data;
      if (argv.install) {
        console.log('Installing dependencies...');
        const targetDir = isWorkspace ? context.cwd : path.resolve(context.cwd, appData.appDir);
        return yarn.install(targetDir);
      } else {
        return { isInstalled: false, appDir: appData.appDir };
      }
    })
    .then((result) => {
      if (result.isInstalled) {
        console.log(`"cd ${appData.appDir}" and then "stripes serve" to run your new app`);
      } else if (isWorkspace) {
        console.log(`"yarn install", "cd ${appData.appDir}", and then "stripes serve" to run your new app`);
      } else {
        console.log(`"cd ${appData.appDir}", "yarn install", and then "stripes serve" to run your new app`);
      }
      return Promise.resolve();
    })
    .then(() => {
      if (argv.assign) {
        console.log('Pushing module descriptor to Okapi...');
        // Change working directory for remaining commands
        argv.workingDir = appData.appDir;
        const argvUiModCtx = applyContext(argv);
        return addModCommand.handler(argvUiModCtx)
          .then((response) => {
            if (response.success) {
              console.log(`Module descriptor ${response.id} added to Okapi`); // TODO: Duplicate message
            } else if (response.alreadyExists) {
              console.log(`Okapi already has a module with id ${response.id}. To force an update run "stripes mod update" from the app dir.`);
            }
            return Promise.resolve();
          })
          .then(() => enableModCommand.handler(argvUiModCtx))
          .then(() => {
            // Assign the new permission to a user
            argv.name = [
              `module.${appData.appName}.enabled`,
              `settings.${appData.appName}.enabled`,
            ];
            return assignPermCommand.handler(argvUiModCtx);
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

export default {
  command: 'create [name]',
  describe: 'Create a new Stripes app module',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
        promptMiddleware(appOptions),
      ])
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
  handler: createAppCommand,
};
