const importLazy = require('import-lazy')(require);

const context = importLazy('../../cli-context');
const Okapi = importLazy('../../okapi');
const ModuleService = importLazy('../../okapi/module-service');
const { applyOptions, okapiOptions } = importLazy('../common-options');


function removeModuleDescriptorCommand(argv) {
  // check for app context, then load package.json
  if (context.type !== 'app') {
    console.log('Only APP modules are supported by mod remove command.');
    return Promise.reject();
  }

  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi, context);

  return moduleService.removeModuleDescriptor(context.moduleDescriptor)
    .then((response) => {
      if (response.doesNotExist) {
        console.log(`Module descriptor ${response.id} does not exist in Okapi`);
      } else {
        console.log(`Module descriptor ${response.id} removed from Okapi`);
      }
    });
}

module.exports = {
  command: 'remove',
  describe: 'Remove app\'s module descriptor from Okapi',
  builder: (yargs) => {
    yargs
      .example('$0 mod add', '');
    return applyOptions(yargs, Object.assign({}, okapiOptions));
  },
  handler: removeModuleDescriptorCommand,
};
