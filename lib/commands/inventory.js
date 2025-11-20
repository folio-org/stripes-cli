import { contextMiddleware } from '../cli/context-middleware.js';
import { fetchAndStoreModules } from '../environment/inventory.js';

function inventoryCommand(argv) {
  if (argv.fetch) {
    return fetchAndStoreModules().then(() => { return Promise.resolve(); });
  }

  return Promise.resolve();
}

export default {
  command: 'inventory',
  describe: 'Manage local inventory cache to supply module data for `stripes workspace`.',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
      ]);
    yargs.option('fetch', {
      describe: 'Fetch module names from Github and store in local cache. Note that there is a rate limit per IP to Github, so you can\'t call this too many times in a short time period.',
      type: 'boolean',
      default: true,
    });
    yargs.example('$0 inventory --fetch', 'Fetch module names from Github and store in local cache.');
    return yargs;
  },
  handler: inventoryCommand,
};
