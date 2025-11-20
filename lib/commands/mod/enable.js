import { contextMiddleware } from '../../cli/context-middleware.js';
import Okapi from '../../okapi/index.js';
import ModuleService from '../../okapi/module-service.js';
import DescriptorService from '../../okapi/descriptor-service.js';
import { moduleIdsStdin, okapiRequired, tenantRequired } from '../common-options.js';
import { stdinArrayMiddleware } from '../../cli/stdin-middleware.js';

function enableModuleCommand(argv) {
  const context = argv.context;
  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi);
  let descriptorIds;

  if (argv.ids) {
    descriptorIds = argv.ids;
  } else if (context.isUiModule || context.isBackendModule) {
    const descriptorService = new DescriptorService(context);
    descriptorIds = descriptorService.getModuleDescriptorsFromContext().map(descriptor => descriptor.id);
  } else {
    console.log('No module descriptor ids provided');
    return Promise.reject();
  }

  return moduleService.enableModulesForTenant(descriptorIds, argv.tenant)
    .then((responses) => {
      responses.forEach(response => {
        if (response.alreadyExists) {
          console.log(`Module ${response.id} already associated with tenant ${argv.tenant}`);
        } else {
          console.log(`Module ${response.id} associated with tenant ${argv.tenant}`);
        }
      });
    });
}

export default {
  command: 'enable',
  describe: 'Enable an app module descriptor for a tenant in Okapi',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
        stdinArrayMiddleware('ids'),
      ])
      .options(Object.assign({}, moduleIdsStdin, okapiRequired, tenantRequired))
      .example('$0 mod enable --tenant diku', 'Enable the current ui-module (app context)')
      .example('$0 mod enable --ids one two --tenant diku', 'Enable module ids "one" and "two" for tenant diku')
      .example('echo one two | $0 mod enable --tenant diku', 'Enable module ids "one" and "two" for tenant diku with stdin');
  },
  handler: enableModuleCommand,
};
