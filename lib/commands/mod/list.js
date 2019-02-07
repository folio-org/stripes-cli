const importLazy = require('import-lazy')(require);

const Okapi = importLazy('../../okapi');
const ModuleService = importLazy('../../okapi/module-service');
const { okapiRequired, tenantOption } = importLazy('../common-options');


function listModuleCommand(argv) {
  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi);

  const options = {
    provide: argv.provide,
    require: argv.require,
  };

  const promise = argv.tenant
    ? moduleService.listModulesForTenant(argv.tenant, options)
    : moduleService.listModules(options);

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
      .option('provide', {
        describe: 'limit to provided interface',
        type: 'string',
        conflicts: ['require'],
      })
      .option('require', {
        describe: 'limit to required interface',
        type: 'string',
        conflicts: ['provide'],
      })
      .options(Object.assign({}, okapiRequired, tenantOption))
      .example('$0 mod list', 'List all available module ids in Okapi')
      .example('$0 mod list --provide notes', 'List module ids that provide "notes" interface')
      .example('$0 mod list --require notes', 'List module ids that require "notes" interface')
      .example('$0 mod list --tenant diku', 'List enabled module ids for tenant diku')
      .example('$0 mod list --no-tenant', 'List available module ids in Okapi (overriding any tenant set via config)');
  },
  handler: listModuleCommand,
};
