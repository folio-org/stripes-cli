const importLazy = require('import-lazy')(require);

const context = importLazy('../../cli-context');
const Okapi = importLazy('../../okapi');
const ModuleService = importLazy('../../okapi/module-service');
const { applyOptions, okapiOptions } = importLazy('../common-options');


function disableModuleCommand(argv) {
  // check for app context, then load package.json
  if (context.type !== 'app') {
    console.log('Only APP modules are supported by mod disable command.');
    return Promise.reject();
  }

  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi, context);

  return moduleService.disableModuleForTenant(context.moduleDescriptor, argv.tenant)
    .then((response) => {
      if (response.something) {
        console.log(`Module ${response.id} not associated with tenant ${argv.tenant}`);
      } else {
        console.log(`Module ${response.id} no longer associated with tenant ${argv.tenant}`);
      }
    });
}

module.exports = {
  command: 'disable',
  describe: 'Disable app\'s module descriptor with an Okapi tenant',
  builder: (yargs) => {
    yargs
      .example('$0 mod disable --tenant diku', '');
    return applyOptions(yargs, Object.assign({}, okapiOptions));
  },
  handler: disableModuleCommand,
};
