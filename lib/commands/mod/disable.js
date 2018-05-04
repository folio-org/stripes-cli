const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const Okapi = importLazy('../../okapi');
const ModuleService = importLazy('../../okapi/module-service');
const { applyOptions, okapiOptions } = importLazy('../common-options');
const { stdinArrayHandler } = importLazy('../../cli/stdin-handler');

function disableModuleCommand(argv, context) {
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

  return moduleService.disableModulesForTenant(descriptorIds, argv.tenant)
    .then((responses) => responses.forEach(response => console.log(`Module ${response.id} no longer associated with tenant ${argv.tenant}`)));
}

module.exports = {
  command: 'disable',
  describe: 'Disable modules for a tenant in Okapi',
  builder: (yargs) => {
    yargs
      .option('ids', {
        describe: 'Module descriptor ids to disable (or use stdin)',
        type: 'array',
      })
      .example('$0 mod disable --tenant diku', 'Disable the current ui-module (app context)')
      .example('$0 mod disable --ids folio_one-1.0.0 folio_two-1.0.0 --tenant diku', 'Disable specific module ids')
      .example('echo folio_one-1.0.0 folio_two-1.0.0 | $0 mod disable --tenant diku', 'Disable specific module ids with stdin');
    return applyOptions(yargs, Object.assign({}, okapiOptions));
  },
  handler: mainHandler(stdinArrayHandler('ids', disableModuleCommand)),
};
