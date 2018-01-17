const importLazy = require('import-lazy')(require);

const context = importLazy('../../cli-context');
const Okapi = importLazy('../../okapi');
const ModuleService = importLazy('../../okapi/module-service');
const { applyOptions, okapiOptions } = importLazy('../common-options');


function addModuleDescriptorCommand(argv) {
  // check for app context, then load package.json
  if (context.type !== 'app') {
    console.log('Only APP modules are supported by mod add command.');
    return Promise.reject();
  }

  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi, context);

  return moduleService.addModuleDescriptor(context.moduleDescriptor)
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
  describe: 'Add app\'s module descriptor to Okapi',
  builder: (yargs) => {
    yargs
      .example('$0 mod add', '');
    return applyOptions(yargs, Object.assign({}, okapiOptions));
  },
  handler: addModuleDescriptorCommand,
};
