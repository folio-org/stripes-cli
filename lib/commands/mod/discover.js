const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const Okapi = importLazy('../../okapi');
const DiscoveryService = importLazy('../../okapi/discovery-service');
const { applyOptions, okapiRequired } = importLazy('../common-options');

function discoverModuleCommand(argv, context) {
  if (!context.isBackendModule) {
    console.log('"mod discover" only works in the backend-module context');
    return Promise.reject();
  }

  const okapi = new Okapi(argv.okapi, argv.tenant);
  const discoveryService = new DiscoveryService(okapi, context);

  if (argv.forget) {
    return discoveryService.removeInstancesForContext()
      .then((response) => {
        if (response.success) {
          console.log(`Instances for ${response.id} removed from Okapi`);
        } else {
          console.log(`No instances found for ${response.id}`);
        }
      });
  } else if (argv.url) {
    return discoveryService.addInstanceForContext(argv.url)
      .then((response) => {
        if (response.success) {
          console.log(`Module ${response.id} instance ${response.instId} registered with Okapi`);
        }
      });
  } else {
    return discoveryService.listInstancesForContext()
      .then((response) => {
        if (response.success) {
          console.log(response.instances);
        } else {
          console.log(`No instances found for ${response.id}`);
        }
      });
  }
}

module.exports = {
  command: 'discover',
  describe: 'Manage instances for the current backend module with Okapi\'s _/discovery endpoint (work in progress)',
  builder: (yargs) => {
    yargs
      .option('url', {
        describe: 'Register instance running at URL',
        type: 'string',
        conflicts: 'forget',
      })
      .option('forget', {
        describe: 'Unregister instances',
        type: 'boolean',
        conflicts: 'url',
      })
      .example('$0 mod discover', 'View current instances')
      .example('$0 mod discover --url', 'Register instance running at URL with Okapi')
      .example('$0 mod discover --forget', 'Unregister running instances with Okapi');
    return applyOptions(yargs, Object.assign({}, okapiRequired));
  },
  handler: mainHandler(discoverModuleCommand),
};
