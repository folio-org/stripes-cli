const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const Okapi = importLazy('../../okapi');
const ModuleService = importLazy('../../okapi/module-service');
const { applyOptions, okapiOptions } = importLazy('../common-options');


function updateModuleDescriptorCommand(argv, context) {
  // check for app context, then load package.json
  if (context.type !== 'app') {
    console.log('"mod update" only works in the APP context');
    return Promise.reject();
  }

  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi, context);

  return moduleService.updateModuleDescriptor(context.moduleDescriptor)
    .then((response) => {
      if (response.success) {
        console.log(`Module descriptor ${response.id} updated in Okapi`);
      }
    });
}

module.exports = {
  command: 'update',
  describe: 'Update an app module descriptor in Okapi',
  builder: (yargs) => {
    yargs
      .example('$0 mod update', '');
    return applyOptions(yargs, Object.assign({}, okapiOptions));
  },
  handler: mainHandler(updateModuleDescriptorCommand),
};
