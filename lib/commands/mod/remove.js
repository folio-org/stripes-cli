const importLazy = require('import-lazy')(require);

const { contextMiddleware } = importLazy('../../cli/context-middleware');
const Okapi = importLazy('../../okapi');
const ModuleService = importLazy('../../okapi/module-service');
const DescriptorService = importLazy('../../okapi/descriptor-service');
const { moduleIdsStdin, okapiRequired } = importLazy('../common-options');
const { stdinArrayMiddleware } = importLazy('../../cli/stdin-middleware');


function removeModuleDescriptorCommand(argv) {
  const context = argv.context;
  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi);
  let descriptorIds;

  if (argv.ids) {
    descriptorIds = argv.ids;
  } else if (context.isUiModule || context.isBackendModule) {
    const descriptorService = new DescriptorService(context);
    descriptorIds = descriptorService.getModuleDescriptorsFromContext().map(descriptor => descriptor.id);
  } else {
    console.log('No module descriptor ids provided');
    return Promise.reject();
  }

  return moduleService.removeModuleDescriptorIds(descriptorIds)
    .then((responses) => responses.forEach((response) => {
      if (response.doesNotExist) {
        console.log(`Module descriptor ${response.id} does not exist in Okapi`);
      } else {
        console.log(`Module descriptor ${response.id} removed from Okapi`);
      }
    }));
}

module.exports = {
  command: 'remove',
  describe: 'Remove a module descriptor from Okapi',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
        stdinArrayMiddleware('ids'),
      ])
      .options({ ...moduleIdsStdin, ...okapiRequired })
      .example('$0 mod remove', 'Remove ui-module located in current directory')
      .example('$0 mod remove --ids one two', 'Remove module ids "one" and "two" from Okapi')
      .example('echo one two | $0 mod remove', 'Remove module ids "one" and "two" from Okapi with stdin');
  },
  handler: removeModuleDescriptorCommand,
};
