const importLazy = require('import-lazy')(require);

const Okapi = importLazy('../../okapi');
const PermissionService = importLazy('../../okapi/permission-service');
const { stdinArrayMiddleware } = importLazy('../../cli/stdin-middleware');


function filterPermissionsCommand(argv, context) {
  const okapi = new Okapi(argv.okapi, argv.tenant);
  const permissionService = new PermissionService(okapi, context);

  if (!argv.assigned && !argv.unassigned) {
    console.log('A filter must be specified');
    return;
  }

  const filteredPromise = argv.assigned
    ? permissionService.filterAssignedPermissions(argv.name, argv.assigned)
    : permissionService.filterUnassignedPermissions(argv.name, argv.unassigned);

  filteredPromise.then(permissions => permissions.forEach(perm => console.log(perm)));
}

module.exports = {
  command: 'filter',
  describe: 'Filter permissions',
  builder: (yargs) => {
    yargs
      .middleware([
        stdinArrayMiddleware('name'),
      ])
      .option('name', {
        describe: 'Names of the permissions to filter (stdin)',
        type: 'array',
      })
      .option('assigned', {
        describe: 'User to filter by assigned',
        type: 'string',
        conflicts: 'unassigned',
      })
      .option('unassigned', {
        describe: 'User to filter by unassigned',
        type: 'string',
        conflicts: 'assigned',
      })
      .example('echo one two | $0 perm filter --assigned diku_admin', 'Filter by assigned permissions')
      .example('echo one two | $0 perm filter --unassigned diku_admin', 'Filter by unassigned permissions');
    return yargs;
  },
  handler: filterPermissionsCommand,
};
