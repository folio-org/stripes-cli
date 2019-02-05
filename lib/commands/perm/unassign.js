const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const Okapi = importLazy('../../okapi');
const PermissionService = importLazy('../../okapi/permission-service');
const { applyOptions, okapiRequired, tenantRequired } = importLazy('../common-options');
const { promptMiddleware } = importLazy('../../cli/prompt-middleware');
const { stdinArrayHandler } = importLazy('../../cli/stdin-handler');

function unassignPermissionsCommand(argv, context) {
  const okapi = new Okapi(argv.okapi, argv.tenant);
  const permissionService = new PermissionService(okapi, context);

  if (!Array.isArray(argv.name)) {
    argv.name = [argv.name];
  }

  return permissionService.unassignPermissionsFromUser(argv.name, argv.user)
    .then((responses) => {
      responses.forEach(response => {
        if (response.alreadySatisfied) {
          console.log(`User ${argv.user} does not have permission ${response.id}`);
        } else {
          console.log(`User ${argv.user} unassigned permission ${response.id}`);
        }
      });
    });
}

const permOptions = {
  name: {
    describe: 'Name of the permission (stdin)',
    type: 'string',
    group: 'Permission Options:',
  },
  user: {
    describe: 'Username to unassign permission from',
    type: 'string',
    group: 'Permission Options:',
  },
};

module.exports = {
  command: 'unassign',
  describe: 'Unassign permissions from a user',
  builder: (yargs) => {
    yargs
      .middleware(promptMiddleware(permOptions))
      .option('name', permOptions.name)
      .option('user', permOptions.user)
      .example('$0 perm unassign --name module.hello-world.enabled --user diku_admin', 'Unassign permission from user diku_admin');
    return applyOptions(yargs, Object.assign({}, okapiRequired, tenantRequired));
  },
  handler: mainHandler(stdinArrayHandler('name', unassignPermissionsCommand)),
};
