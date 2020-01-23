const importLazy = require('import-lazy')(require);

const { contextMiddleware } = importLazy('../../cli/context-middleware');
const Okapi = importLazy('../../okapi');
const ModuleService = importLazy('../../okapi/module-service');
const DescriptorService = importLazy('../../okapi/descriptor-service');
const { moduleIdsStdin, okapiRequired, tenantRequired } = importLazy('../common-options');
const { stdinArrayMiddleware } = importLazy('../../cli/stdin-middleware');

function disableModuleCommand(argv) {
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

  return moduleService.disableModulesForTenant(descriptorIds, argv.tenant)
    .then((responses) => responses.forEach(response => console.log(`Module ${response.id} no longer associated with tenant ${argv.tenant}`)));
}

module.exports = {
  command: 'disable',
  describe: 'Disable modules for a tenant in Okapi',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
        stdinArrayMiddleware('ids'),
      ])
      .options({ ...moduleIdsStdin, ...okapiRequired, ...tenantRequired })
      .example('$0 mod disable --tenant diku', 'Disable the current ui-module (app context)')
      .example('$0 mod disable --ids one two --tenant diku', 'Disable module ids "one" and "two" for tenant diku')
      .example('echo one two | $0 mod disable --tenant diku', 'Disable module ids "one" and "two" for tenant diku with stdin');
  },
  handler: disableModuleCommand,
};
