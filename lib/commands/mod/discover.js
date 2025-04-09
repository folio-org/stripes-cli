import { contextMiddleware } from '../../cli/context-middleware.js';
import Okapi from '../../okapi/index.js';
import DiscoveryService from '../../okapi/discovery-service.js';
import { okapiRequired } from '../common-options.js';

function discoverModuleCommand(argv) {
  const context = argv.context;
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
  } else if (argv.port) {
    return discoveryService.addLocalInstanceForContextOnVagrantVM(argv.port)
      .then((response) => {
        if (response.success) {
          console.log(`Module ${response.id} instance ${response.instId} registered with Okapi`);
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

export default {
  command: 'discover',
  describe: 'Manage instances for the current backend module with Okapi\'s _/discovery endpoint',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
      ])
      .option('port', {
        describe: 'Register a locally hosted instance running on port number (for use with Okapi in a Vagrant box)',
        type: 'number',
        conflicts: ['forget', 'url'],
      })
      .option('url', {
        describe: 'Register instance running at URL',
        type: 'string',
        conflicts: ['forget', 'port'],
      })
      .option('forget', {
        describe: 'Unregister instances',
        type: 'boolean',
        conflicts: ['url', 'port'],
      })
      .option(okapiRequired)
      .example('$0 mod discover', 'View current instances')
      .example('$0 mod discover --url', 'Register instance running at URL with Okapi')
      .example('$0 mod discover --forget', 'Unregister running instances with Okapi');
  },
  handler: discoverModuleCommand,
};
