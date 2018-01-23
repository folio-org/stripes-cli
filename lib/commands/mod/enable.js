const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const Okapi = importLazy('../../okapi');
const ModuleService = importLazy('../../okapi/module-service');
const { applyOptions, okapiOptions } = importLazy('../common-options');


function enableModuleCommand(argv, context) {
  // check for app context, then load package.json
  if (context.type !== 'app') {
    console.log('"mod enable" only works in the APP context');
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
  describe: 'Enable an app module descriptor for a tenant in Okapi',
  builder: (yargs) => {
    yargs
      .example('$0 mod enable --tenant diku', '');
    return applyOptions(yargs, Object.assign({}, okapiOptions));
  },
  handler: mainHandler(enableModuleCommand),
};
