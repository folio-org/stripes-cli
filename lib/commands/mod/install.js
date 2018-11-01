const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const Okapi = importLazy('../../okapi');
const OkapiError = importLazy('../../okapi/okapi-error');
const ModuleService = importLazy('../../okapi/module-service');
const { applyOptions, moduleIdsStdin, okapiOptions } = importLazy('../common-options');
const { stdinArrayHandler } = importLazy('../../cli/stdin-handler');


function installModulesCommand(argv, context) {
  if (!argv.ids) {
    console.log('No module descriptor ids specified.');
    return Promise.resolve();
  }

  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi, context);

  return moduleService.installModulesForTenant(argv.ids, argv.tenant, argv.simulate)
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      if (error instanceof OkapiError) {
        const match = argv.ids.find(id => id === error.message);
        if (match) {
          console.log(`Module descriptor ${error.message} does not exist in Okapi`);
        } else if (error.statusCode < 500 && error.message) {
          console.log(error.message);
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    });
}

module.exports = {
  command: 'install',
  describe: 'Enable, disable, or upgrade one or more modules for a tenant in Okapi (work in progress)',
  builder: (yargs) => {
    yargs
      .option('simulate', {
        describe: 'Perform a dry run',
        type: 'boolean'
      })
      .example('$0 mod install --ids one two --tenant diku', 'Install module ids "one" and "two"')
      .example('echo one two | $0 mod install --tenant diku', 'Install module ids "one" and "two" using stdin');
    return applyOptions(yargs, Object.assign({}, moduleIdsStdin, okapiOptions));
  },
  handler: mainHandler(stdinArrayHandler('ids', installModulesCommand)),
};
