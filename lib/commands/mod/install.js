const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const Okapi = importLazy('../../okapi');
const ModuleService = importLazy('../../okapi/module-service');
const { applyOptions, okapiOptions } = importLazy('../common-options');


function installModulesCommand(argv, context) {
  if (!argv.modules) {
    console.log('No modules specified.');
    return Promise.resolve();
  }

  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi, context);

  return moduleService.installModulesForTenant(argv.modules, argv.tenant)
    .then((response) => {
      console.log(response);
    });
}

module.exports = {
  command: 'install',
  describe: 'Enable, disable, or upgrade one or more modules for a tenant in Okapi',
  builder: (yargs) => {
    yargs
      .option('modules', {
        describe: 'List of modules to enable',
        type: 'array'
      })
      .example('$0 mod install --modules folio_users-2.12.2000308 folio_search-1.1.100082 --tenant diku', '');
    return applyOptions(yargs, Object.assign({}, okapiOptions));
  },
  handler: mainHandler(installModulesCommand),
};
