const importLazy = require('import-lazy')(require);

const { contextMiddleware } = importLazy('../../cli/context-middleware');
const Okapi = importLazy('../../okapi');
const ModuleService = importLazy('../../okapi/module-service');
const DescriptorService = importLazy('../../okapi/descriptor-service');
const { applyOptions, okapiRequired } = importLazy('../common-options');


function addModuleDescriptorCommand(argv) {
  const context = argv.context;
  // check for app context, then load package.json
  if (!context.isUiModule && !context.isBackendModule) {
    console.log('"mod add" only works in the ui-module or backend-module context');
    return Promise.reject();
  }

  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi);
  const descriptorService = new DescriptorService(context, argv.configFile);

  const descriptors = descriptorService.getModuleDescriptorsFromContext(argv.strict);
  return moduleService.addModuleDescriptor(descriptors[0])
    .then((response) => {
      if (response.alreadyExists) {
        console.log(`Module descriptor ${response.id} already exists in Okapi`);
      } else {
        console.log(`Module descriptor ${response.id} added to Okapi`);
      }
      return response;
    });
}

module.exports = {
  command: 'add',
  describe: 'Add an app module descriptor to Okapi',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
      ])
      .option('strict', {
        describe: 'Include required interface dependencies',
        type: 'boolean',
        default: false,
      })
      .example('$0 mod add', 'Add descriptor for ui-module in current directory');
    return applyOptions(yargs, Object.assign({}, okapiRequired));
  },
  handler: addModuleDescriptorCommand,
};
