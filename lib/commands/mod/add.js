const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const Okapi = importLazy('../../okapi');
const ModuleService = importLazy('../../okapi/module-service');
const { applyOptions, okapiOptions } = importLazy('../common-options');


function addModuleDescriptorCommand(argv, context) {
  // check for app context, then load package.json
  if (context.type !== 'app') {
    console.log('"mod add" only works in the APP context');
    return Promise.reject();
  }

  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi);

  const descriptors = ModuleService.getModuleDescriptorsFromContext(context, null, argv.strict);
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
      .option('strict', {
        describe: 'Include required interface dependencies',
        type: 'boolean',
        default: false,
      })
      .example('$0 mod add', '');
    return applyOptions(yargs, Object.assign({}, okapiOptions));
  },
  handler: mainHandler(addModuleDescriptorCommand),
};
