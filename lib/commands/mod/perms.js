import Okapi from '../../okapi/index.js';
import ModuleService from '../../okapi/module-service.js';
import { moduleIdsStdin, okapiRequired } from '../common-options.js';
import { stdinArrayMiddleware } from '../../cli/stdin-middleware.js';


function listModulePermissionsCommand(argv) {
  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi);
  let descriptorIds;

  if (argv.ids) {
    descriptorIds = argv.ids;
  } else {
    console.log('No module descriptor ids provided');
    return Promise.reject();
  }

  return moduleService.listModulePermissions(descriptorIds, argv.expand)
    .then((responses) => {
      if (Array.isArray(responses)) {
        responses.forEach(perm => console.log(perm));
      } else {
        console.log(responses);
      }
    });
}

export default {
  command: 'perms',
  describe: 'List permissions for module ids in Okapi',
  builder: (yargs) => {
    yargs
      .middleware(stdinArrayMiddleware('ids'))
      .option('expand', {
        describe: 'Include sub-permissions',
        type: 'boolean',
        default: false,
      })
      .options(Object.assign({}, moduleIdsStdin, okapiRequired))
      .example('$0 mod perms --ids one two', 'List permissions for ids "one" and "two"')
      .example('echo one two | $0 mod perms', 'List permissions for ids "one" and "two" with stdin');
  },
  handler: listModulePermissionsCommand,
};
