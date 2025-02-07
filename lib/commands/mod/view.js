import Okapi from '../../okapi/index.js';
import ModuleService from '../../okapi/module-service.js';
import { moduleIdsStdin, okapiRequired } from '../common-options.js';
import { stdinArrayMiddleware } from '../../cli/stdin-middleware.js';


function viewModuleCommand(argv) {
  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi);
  let descriptorIds;

  if (argv.ids) {
    descriptorIds = argv.ids;
  } else {
    console.log('No module descriptor ids provided');
    return Promise.reject();
  }

  return moduleService.viewModuleDescriptors(descriptorIds)
    .then((responses) => {
      console.log(JSON.stringify(responses, null, 2));
    });
}

export default {
  command: 'view',
  describe: 'View module descriptors of module ids in Okapi',
  builder: (yargs) => {
    yargs
      .middleware([
        stdinArrayMiddleware('ids'),
      ])
      .options(Object.assign({}, moduleIdsStdin, okapiRequired))
      .example('$0 mod view --ids one two', 'View module descriptors for ids "one" and "two"')
      .example('echo one two | $0 mod view', 'View module descriptors for ids "one" and "two" with stdin');
  },
  handler: viewModuleCommand,
};
