const importLazy = require('import-lazy')(require);

const { contextMiddleware } = importLazy('../../cli/context-middleware');
const { stdinJsonMiddleware } = importLazy('../../cli/stdin-middleware');
const Okapi = importLazy('../../okapi');
const ModuleService = importLazy('../../okapi/module-service');
const DescriptorService = importLazy('../../okapi/descriptor-service');
const { okapiRequired } = importLazy('../common-options');


function addModuleDescriptorCommand(argv) {
  const context = argv.context;
  // check for app context, then load package.json
  if (!context.isUiModule && !context.isBackendModule && !argv.descriptors) {
    console.log('"mod add" needs to be run in the ui-module or backend-module context, or provided JSON descriptors');
    return Promise.reject();
  }

  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi);
  const descriptorService = new DescriptorService(context);

  const descriptors = argv.descriptors || descriptorService.getModuleDescriptorsFromContext(argv.strict);
  return moduleService.addModuleDescriptors(descriptors)
    .then((responses) => responses.forEach((response) => {
      if (response.alreadyExists) {
        console.log(`Module descriptor ${response.id} already exists in Okapi`);
      } else {
        console.log(`Module descriptor ${response.id} added to Okapi`);
      }
      return response;
    }));
}

module.exports = {
  command: 'add',
  describe: 'Add an app module descriptor to Okapi',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
        stdinJsonMiddleware('descriptors'),
      ])
      .option('strict', {
        describe: 'Include required interface dependencies',
        type: 'boolean',
        default: false,
      })
      .option('descriptors', {
        describe: 'Array of module descriptor JSON (stdin)',
        type: 'array',
      })
      .option(okapiRequired)
      .example('$0 mod add', 'Add descriptor for ui-module in current directory');
  },
  handler: addModuleDescriptorCommand,
};
