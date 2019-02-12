const importLazy = require('import-lazy')(require);

const { contextMiddleware } = importLazy('../../cli/context-middleware');
const Okapi = importLazy('../../okapi');
const ModuleService = importLazy('../../okapi/module-service');
const DescriptorService = importLazy('../../okapi/descriptor-service');
const { okapiRequired } = importLazy('../common-options');


function updateModuleDescriptorCommand(argv) {
  const context = argv.context;
  // check for app context, then load package.json
  if (!context.isUiModule) {
    console.log('"mod update" only works in the ui-module context');
    return Promise.reject();
  }

  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi);
  const descriptorService = new DescriptorService(context);

  const descriptors = descriptorService.getModuleDescriptorsFromContext();
  return moduleService.updateModuleDescriptor(descriptors[0])
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
      .middleware([
        contextMiddleware(),
      ])
      .options(okapiRequired)
      .example('$0 mod update', 'Update descriptor for ui-module in current directory');
  },
  handler: updateModuleDescriptorCommand,
};
