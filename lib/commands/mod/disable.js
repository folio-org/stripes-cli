const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const Okapi = importLazy('../../okapi');
const ModuleService = importLazy('../../okapi/module-service');
const { applyOptions, okapiOptions } = importLazy('../common-options');


function disableModuleCommand(argv, context) {
  // check for app context, then load package.json
  if (context.type !== 'app') {
    console.log('"mod disable" only works in the APP context');
    return Promise.reject();
  }

  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi);

  const descriptors = ModuleService.getModuleDescriptorsFromContext(context);
  return moduleService.disableModuleForTenant(descriptors[0], argv.tenant)
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
  describe: 'Disable an app module descriptor for a tenant in Okapi',
  builder: (yargs) => {
    yargs
      .example('$0 mod disable --tenant diku', '');
    return applyOptions(yargs, Object.assign({}, okapiOptions));
  },
  handler: mainHandler(disableModuleCommand),
};
