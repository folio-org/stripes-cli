const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const Okapi = importLazy('../../okapi');
const ModuleService = importLazy('../../okapi/module-service');
const { applyOptions, okapiOptions } = importLazy('../common-options');
const { stdinArrayHandler } = importLazy('../../cli/stdin-handler');


function viewModuleCommand(argv, context) {
  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi, context);
  let descriptorIds;

  if (argv.ids) {
    descriptorIds = argv.ids;
  } else {
    console.log('No module descriptor ids provided');
    return Promise.reject();
  }

  return moduleService.viewModuleDescriptors(descriptorIds, argv.tenant)
    .then((responses) => {
      console.log(JSON.stringify(responses, null, 2));
    });
}

module.exports = {
  command: 'view',
  describe: 'View module descriptors of module ids in Okapi',
  builder: (yargs) => {
    yargs
      .option('ids', {
        describe: 'Module descriptor ids',
        type: 'array',
      })
      .example('$0 mod view --ids one two', 'View module descriptors for ids "one" and "two"')
      .example('echo one two | $0 mod view', 'View module descriptors for ids "one" and "two" with stdin');
    return applyOptions(yargs, Object.assign({}, okapiOptions));
  },
  handler: mainHandler(stdinArrayHandler('ids', viewModuleCommand)),
};
