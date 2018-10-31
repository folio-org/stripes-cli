const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const Okapi = importLazy('../../okapi');
const ModuleService = importLazy('../../okapi/module-service');
const { applyOptions, okapiOptions } = importLazy('../common-options');


function pullModuleDescriptorsCommand(argv, context) {
  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi, context);

  return moduleService.pullModuleDescriptorsFromRemote(argv.remote)
    .then((response) => {
      if (Array.isArray(response)) {
        response.forEach(mod => console.log(mod));
      } else {
        console.log(response);
      }
    });
}

module.exports = {
  command: 'pull',
  describe: 'Pull module descriptors from a remote okapi',
  builder: (yargs) => {
    yargs
      .option('remote', {
        describe: 'Remote Okapi to pull from',
        type: 'string',
        required: true,
      })
      .example('$0 mod pull --okapi http://localhost:9130 --remote http://folio-registry.aws.indexdata.com', 'Pull module descriptors from remote Okapi');
    return applyOptions(yargs, Object.assign({}, okapiOptions));
  },
  handler: mainHandler(pullModuleDescriptorsCommand),
};
