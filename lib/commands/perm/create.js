const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const { promptHandler } = importLazy('../../cli/questions');
const Okapi = importLazy('../../okapi');
const PermissionService = importLazy('../../okapi/permission-service');
const { applyOptions, okapiOptions } = importLazy('../common-options');
const addModCommand = importLazy('../mod/add');
const updateModCommand = importLazy('../mod/update');
const assignPermCommand = importLazy('../perm/assign');

function createPermCommand(argv, context) {
  // check for app context, then load package.json
  if (context.type !== 'app') {
    return 'Only APP modules are supported by perm commands.';
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
      if (argv.assign) {
        return assignPermCommand.handler(argv);
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

module.exports = {
  command: 'create [name]',
  describe: 'Adds new UI permission to permissionSet', // TODO: Handle sub-permissions
  builder: (yargs) => {
    yargs
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
      .example('$0 perm create ui-my-app.example', 'Create a new permission for this UI module')
      .example('$0 perm create ui-my-app.example --push --assign someone', 'Create a new permission, update the module descriptor, and assign permission to user someone');
    return applyOptions(yargs, Object.assign({}, okapiOptions));
  },
  handler: mainHandler(promptHandler(permOptions, createPermCommand)),
};
