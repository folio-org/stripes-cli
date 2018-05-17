const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const Okapi = importLazy('../../okapi');
const ModuleService = importLazy('../../okapi/module-service');
const { applyOptions, okapiOptions } = importLazy('../common-options');
const { stdinArrayHandler } = importLazy('../../cli/stdin-handler');

function enableModuleCommand(argv, context) {
  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi);
  let descriptorIds;

  if (argv.ids) {
    descriptorIds = argv.ids;
  } else if (context.type === 'app') {
    descriptorIds = ModuleService.getModuleDescriptorsFromContext(context).map(descriptor => descriptor.id);
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

module.exports = {
  command: 'enable',
  describe: 'Enable an app module descriptor for a tenant in Okapi',
  builder: (yargs) => {
    yargs
      .option('ids', {
        describe: 'Module descriptor ids',
        type: 'array',
      })
      .example('$0 mod enable --tenant diku', 'Enable the current ui-module (app context)')
      .example('$0 mod enable --ids one two --tenant diku', 'Enable module ids "one" and "two" for tenant diku')
      .example('echo one two | $0 mod enable --tenant diku', 'Enable module ids "one" and "two" for tenant diku with stdin');
    return applyOptions(yargs, Object.assign({}, okapiOptions));
  },
  handler: mainHandler(stdinArrayHandler('ids', enableModuleCommand)),
};
