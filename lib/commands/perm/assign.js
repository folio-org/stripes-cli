const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const Okapi = importLazy('../../okapi');
const PermissionService = importLazy('../../okapi/permission-service');
const { applyOptions, okapiOptions } = importLazy('../common-options');
const { promptHandler } = importLazy('../../cli/questions');
const { stdinArrayHandler } = importLazy('../../cli/stdin-handler');

function assignPermissionsCommand(argv, context) {
  // TODO: update aliases
  argv.assign = argv.assign || argv.user;

  const okapi = new Okapi(argv.okapi, argv.tenant);
  const permissionService = new PermissionService(okapi, context);

  if (!Array.isArray(argv.name)) {
    argv.name = [argv.name];
  }

  return permissionService.assignPermissionsToUser(argv.name, argv.assign)
    .then((responses) => {
      responses.forEach(response => {
        if (response.alreadyExists) {
          console.log(`User ${argv.assign} already has permission ${response.id}`);
        } else {
          console.log(`User ${argv.assign} assigned permission ${response.id}`);
        }
      });
    });
}

const permOptions = {
  name: {
    describe: 'Name of the permission',
    type: 'string',
    group: 'Permission Options:',
  },
  user: {
    describe: 'Username to assign permission to',
    type: 'string',
    group: 'Permission Options:',
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
  handler: mainHandler(stdinArrayHandler('name', promptHandler(permOptions, assignPermissionsCommand))),
};
