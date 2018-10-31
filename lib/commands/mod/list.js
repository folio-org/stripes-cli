const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const Okapi = importLazy('../../okapi');
const ModuleService = importLazy('../../okapi/module-service');
const { applyOptions, okapiOptions } = importLazy('../common-options');


function listModuleCommand(argv, context) {
  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi, context);

  const promise = argv.tenant
    ? moduleService.listModulesForTenant(argv.tenant)
    : moduleService.listModules();

  return promise
    .then((response) => {
      if (Array.isArray(response)) {
        response.forEach(mod => console.log(mod));
      } else {
        console.log(response);
      }
    });
}

module.exports = {
  command: 'list',
  describe: 'List all module ids available in Okapi or enabled for a tenant',
  builder: (yargs) => {
    yargs
      .example('$0 mod list --tenant diku', 'List enabled module ids for tenant diku')
      .example('$0 mod list', 'List all available module ids in Okapi')
      .example('$0 mod list --no-tenant', 'List available module ids in Okapi (overriding any tenant set via config)');
    return applyOptions(yargs, Object.assign({}, okapiOptions));
  },
  handler: mainHandler(listModuleCommand),
};
