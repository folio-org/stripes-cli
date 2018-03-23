const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const Okapi = importLazy('../../okapi');
const PermissionService = importLazy('../../okapi/permission-service');
const { applyOptions, okapiOptions } = importLazy('../common-options');


function viewPermissionsCommand(argv, context) {
  const okapi = new Okapi(argv.okapi, argv.tenant);
  const permissionService = new PermissionService(okapi, context);

  return permissionService.viewPermissionsForUser(argv.user)
    .then((response) => {
      if (Array.isArray(response)) {
        response.forEach(perm => console.log(perm));
      } else {
        console.log(response);
      }
    });
}

module.exports = {
  command: 'view',
  describe: 'View permission for a user',
  builder: (yargs) => {
    yargs
      .option('user', {
        describe: 'Username',
        type: 'string',
        required: true,
      })
      .example('$0 perm view --user diku_admin', 'View permissions for user diku_admin');
    return applyOptions(yargs, okapiOptions);
  },
  handler: mainHandler(viewPermissionsCommand),
};
