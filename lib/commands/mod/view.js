const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const Okapi = importLazy('../../okapi');
const ModuleService = importLazy('../../okapi/module-service');
const { applyOptions, okapiOptions } = importLazy('../common-options');


function viewModuleCommand(argv, context) {
  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi, context);

  return moduleService.viewModulesForTenant(argv.tenant)
    .then((response) => {
      if (Array.isArray(response)) {
        response.forEach(mod => console.log(mod));
      } else {
        console.log(response);
      }
    });
}

module.exports = {
  command: 'view',
  describe: 'View enabled modules for a tenant in Okapi',
  builder: (yargs) => {
    yargs
      .option('test', {
        type: 'boolean',
      })
      .example('$0 mod view --tenant diku', '');
    return applyOptions(yargs, Object.assign({}, okapiOptions));
  },
  handler: mainHandler(viewModuleCommand),
};
