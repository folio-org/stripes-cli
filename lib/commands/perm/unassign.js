import Okapi from '../../okapi/index.js';
import PermissionService from '../../okapi/permission-service.js';
import { okapiRequired, tenantRequired } from '../common-options.js';
import { promptMiddleware } from '../../cli/prompt-middleware.js';
import { stdinArrayMiddleware } from '../../cli/stdin-middleware.js';

function unassignPermissionsCommand(argv) {
  const okapi = new Okapi(argv.okapi, argv.tenant);
  const permissionService = new PermissionService(okapi);

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

export default {
  command: 'unassign',
  describe: 'Unassign permissions from a user',
  builder: (yargs) => {
    yargs
      .middleware(stdinArrayMiddleware('name'))
      .middleware(promptMiddleware(permOptions))
      .option('name', permOptions.name)
      .option('user', permOptions.user)
      .options(Object.assign({}, okapiRequired, tenantRequired))
      .example('$0 perm unassign --name module.hello-world.enabled --user diku_admin', 'Unassign permission from user diku_admin');
  },
  handler: unassignPermissionsCommand,
};
