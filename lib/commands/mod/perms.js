const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const Okapi = importLazy('../../okapi');
const ModuleService = importLazy('../../okapi/module-service');
const { applyOptions, moduleIdsStdin, okapiRequired } = importLazy('../common-options');
const { stdinArrayHandler } = importLazy('../../cli/stdin-handler');


function listModulePermissionsCommand(argv, context) {
  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi, context);
  let descriptorIds;

  if (argv.ids) {
    descriptorIds = argv.ids;
  } else {
    console.log('No module descriptor ids provided');
    return Promise.reject();
  }

  return moduleService.listModulePermissions(descriptorIds, argv.expand)
    .then((responses) => {
      if (Array.isArray(responses)) {
        responses.forEach(perm => console.log(perm));
      } else {
        console.log(responses);
      }
    });
}

module.exports = {
  command: 'perms',
  describe: 'List permissions for module ids in Okapi',
  builder: (yargs) => {
    yargs
      .option('expand', {
        describe: 'Include sub-permissions',
        type: 'boolean',
        default: false,
      })
      .example('$0 mod perms --ids one two', 'List permissions for ids "one" and "two"')
      .example('echo one two | $0 mod perms', 'List permissions for ids "one" and "two" with stdin');
    return applyOptions(yargs, Object.assign({}, moduleIdsStdin, okapiRequired));
  },
  handler: mainHandler(stdinArrayHandler('ids', listModulePermissionsCommand)),
};
