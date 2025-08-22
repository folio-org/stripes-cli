import Okapi from '../../okapi/index.js';
import PermissionService from '../../okapi/permission-service.js';
import { okapiRequired, tenantRequired } from '../common-options.js';
import { promptMiddleware } from '../../cli/prompt-middleware.js';
import { stdinArrayMiddleware } from '../../cli/stdin-middleware.js';

function assignPermissionsCommand(argv) {
  // TODO: update aliases
  argv.assign = argv.assign || argv.user;

  const okapi = new Okapi(argv.okapi, argv.tenant);
  const permissionService = new PermissionService(okapi);

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
    describe: 'Name of the permission (stdin)',
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

export default {
  command: 'assign',
  describe: 'Assign permission to a user',
  builder: (yargs) => {
    yargs
      .middleware([
        stdinArrayMiddleware('name'),
        promptMiddleware(permOptions),
      ])
      .option('name', permOptions.name)
      .option('user', permOptions.user)
      .options(Object.assign({}, okapiRequired, tenantRequired))
      .example('$0 perm assign --name module.hello-world.enabled --user diku_admin', 'Assign permission to user diku_admin')
      .example('$0 perm list --user jack | $0 perm assign --user jill', 'Assign permissions from user jack to user jill');
  },
  handler: assignPermissionsCommand,
};
