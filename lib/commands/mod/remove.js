const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const Okapi = importLazy('../../okapi');
const ModuleService = importLazy('../../okapi/module-service');
const { applyOptions, okapiOptions } = importLazy('../common-options');
const { stdinArrayHandler } = importLazy('../../cli/stdin-handler');


function removeModuleDescriptorCommand(argv, context) {
  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi);
  let descriptorIds;

  if (argv.ids) {
    descriptorIds = argv.ids;
  } else if (context.type === 'app') {
    descriptorIds = ModuleService.getModuleDescriptorsFromContext(context).map(descriptor => descriptor.id);
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
      .option('ids', {
        describe: 'Module descriptor ids',
        type: 'array',
      })
      .example('$0 mod remove', 'Remove ui-module located in current directory')
      .example('$0 mod remove --ids one two', 'Remove module ids "one" and "two" from Okapi')
      .example('echo one two | $0 mod remove', 'Remove module ids "one" and "two" from Okapi with stdin');
    return applyOptions(yargs, Object.assign({}, okapiOptions));
  },
  handler: mainHandler(stdinArrayHandler('ids', removeModuleDescriptorCommand)),
};
