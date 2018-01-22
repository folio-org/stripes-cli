const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const Okapi = importLazy('../../okapi');
const PermissionService = importLazy('../../okapi/permission-service');
const { applyOptions, okapiOptions } = importLazy('../common-options');
const { promptHandler } = importLazy('../../cli/questions');


function assignPermissionsCommand(argv, context) {
  // check for app context, then load package.json
  if (context.type !== 'app') {
    console.log('Only APP modules are supported by perm commands.');
    return Promise.reject();
  }

  const okapi = new Okapi(argv.okapi, argv.tenant);
  const permissionService = new PermissionService(okapi, context);

  return permissionService.assignPermissionToUser(argv.name, argv.assign)
    .then((response) => {
      if (response.alreadyExists) {
        console.log(`User ${argv.assign} already has permission ${argv.name}`);
      } else {
        console.log(`User ${argv.assign} assigned permission ${argv.name}`);
      }
    });
}

const permOptions = {
  name: {
    describe: 'Name of the permission',
    type: 'string',
    group: 'Permission',
  },
  user: {
    describe: 'Username to assign permission to',
    type: 'string',
    group: 'Permission',
    alias: 'assign',
  },
};

module.exports = {
  command: 'assign',
  describe: 'Assign permission to a user',
  builder: (yargs) => {
    yargs
      .option('name', permOptions.name)
      .option('user', permOptions.user)
      .example('$0 perm assign', '');
    return applyOptions(yargs, Object.assign({}, okapiOptions));
  },
  handler: mainHandler(promptHandler(permOptions, assignPermissionsCommand)),
};
