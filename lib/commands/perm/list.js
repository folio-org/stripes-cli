import Okapi from '../../okapi/index.js';
import PermissionService from '../../okapi/permission-service.js';
import { okapiRequired, tenantRequired } from '../common-options.js';


function listPermissionsCommand(argv) {
  const okapi = new Okapi(argv.okapi, argv.tenant);
  const permissionService = new PermissionService(okapi);

  return permissionService.listPermissionsForUser(argv.user)
    .then((response) => {
      if (Array.isArray(response)) {
        response.forEach(perm => console.log(perm));
      } else {
        console.log(response);
      }
    });
}

export default {
  command: 'list',
  describe: 'List permissions for a user',
  aliases: ['view'],
  builder: (yargs) => {
    yargs
      .option('user', {
        describe: 'Username',
        type: 'string',
        required: true,
      })
      .options(Object.assign({}, okapiRequired, tenantRequired))
      .example('$0 perm list --user diku_admin', 'List permissions for user diku_admin');
  },
  handler: listPermissionsCommand,
};
