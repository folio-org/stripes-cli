const importLazy = require('import-lazy')(require);

const context = importLazy('../../cli-context');
const Okapi = importLazy('../../okapi');
const ModuleService = importLazy('../../okapi/module-service');
const { applyOptions, okapiOptions } = importLazy('../common-options');


function enableModuleCommand(argv) {
  // check for app context, then load package.json
  if (context.type !== 'app') {
    console.log('Only APP modules are supported by mod enable command.');
    return Promise.reject();
  }

  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi, context);

  return moduleService.enableModuleForTenant(context.moduleDescriptor, argv.tenant)
    .then((response) => {
      if (response.alreadyExists) {
        console.log(`Module ${response.id} already associated with tenant ${argv.tenant}`);
      } else {
        console.log(`Module ${response.id} associated with tenant ${argv.tenant}`);
      }
    });
}

module.exports = {
  command: 'enable',
  describe: 'Enable app\'s module descriptor with an Okapi tenant',
  builder: (yargs) => {
    yargs
      .example('$0 mod enable --tenant diku', '');
    return applyOptions(yargs, Object.assign({}, okapiOptions));
  },
  handler: enableModuleCommand,
};
