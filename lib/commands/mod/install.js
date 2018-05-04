const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const Okapi = importLazy('../../okapi');
const ModuleService = importLazy('../../okapi/module-service');
const { applyOptions, okapiOptions } = importLazy('../common-options');
const { stdinArrayHandler } = importLazy('../../cli/stdin-handler');


function installModulesCommand(argv, context) {
  if (!argv.ids) {
    console.log('No module descriptor ids specified.');
    return Promise.resolve();
  }

  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi, context);

  return moduleService.installModulesForTenant(argv.ids, argv.tenant)
    .then((response) => {
      console.log(response);
    });
}

module.exports = {
  command: 'install',
  describe: 'Enable, disable, or upgrade one or more modules for a tenant in Okapi',
  builder: (yargs) => {
    yargs
      .option('ids', {
        describe: 'Module descriptor ids',
        type: 'array'
      })
      .example('$0 mod install --ids folio_one-1.0.0 folio_two-1.0.0 --tenant diku', '')
      .example('echo folio_one-1.0.0 folio_two-1.0.0 | $0 mod install --tenant diku', '');
    return applyOptions(yargs, Object.assign({}, okapiOptions));
  },
  handler: mainHandler(stdinArrayHandler('ids', installModulesCommand)),
};
