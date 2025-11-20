import { contextMiddleware } from '../../cli/context-middleware.js';
import { promptMiddleware } from '../../cli/prompt-middleware.js';
import Okapi from '../../okapi/index.js';
import PermissionService from '../../okapi/permission-service.js';
import { okapiOptions } from '../common-options.js';
import addModCommand from '../mod/add.js';
import enableModCommand from '../mod/enable.js';
import updateModCommand from '../mod/update.js';
import assignPermCommand from './assign.js';

function createPermCommand(argv) {
  const context = argv.context;
  // check for app context, then load package.json
  if (!context.isUiModule) {
    return console.log('This command must be run from a ui-module');
  }

  const okapi = new Okapi(argv.okapi, argv.tenant);
  const permissionService = new PermissionService(okapi, context);

  // TODO: Validate permission name matches format 'ui-app.something'
  const newPermission = {
    permissionName: argv.name,
    displayName: argv.desc,
    visible: argv.visible,
  };

  console.log(newPermission);

  return permissionService.addPermissionToPackage(newPermission)
    .then((updatedPackageJson) => {
      if (!updatedPackageJson) {
        console.log(`Permission "${newPermission.permissionName}" already defined in package.json`);
        // TODO: Exit here, or prompt to continue anyway?
      } else {
        console.log(`Permission "${newPermission.permissionName}" added to package.json`);
      }
    })
    .then(() => {
      // Push the new permissions to Okapi via module descriptor update
      if (argv.push) {
        return addModCommand.handler(argv)
          .then((response) => {
            if (response.alreadyExists) {
              return updateModCommand.handler(argv);
            }
            return Promise.resolve();
          });
      }
      return Promise.resolve();
    })
    .then(() => {
      // Assign the new permission to a user
      // and make sure it is enabled for the tenant first
      if (argv.assign) {
        return enableModCommand.handler(argv)
          .then(() => assignPermCommand.handler(argv));
      }
      return Promise.resolve();
    });
}

const permOptions = {
  name: {
    describe: 'Name of the permission',
    type: 'string',
    group: 'Permission Options:',
  },
  desc: {
    describe: 'Description of the permission',
    type: 'string',
    group: 'Permission Options:',
  },
  visible: {
    describe: 'Permission is visible in the UI',
    type: 'boolean',
    default: true,
    group: 'Permission Options:',
  },
};

export default {
  command: 'create [name]',
  describe: 'Adds new UI permission to permissionSet', // TODO: Handle sub-permissions
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
        promptMiddleware(permOptions),
      ])
      .positional('name', permOptions.name)
      .option('desc', permOptions.desc)
      .option('visible', permOptions.visible)
      .option('push', {
        describe: 'Push the permission to Okapi by adding/updating module descriptor',
        type: 'boolean',
        default: false,
      })
      .option('assign', {
        describe: 'Assign the permission to the given user (requires --push)',
        type: 'string',
        implies: 'push',
      })
      .options(okapiOptions)
      .example('$0 perm create ui-my-app.example', 'Create a new permission for this UI module')
      .example('$0 perm create ui-my-app.example --push --assign someone', 'Create a new permission, update the module descriptor, and assign permission to user someone');
  },
  handler: createPermCommand,
};
