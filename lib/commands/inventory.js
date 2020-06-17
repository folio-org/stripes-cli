const importLazy = require('import-lazy')(require);

const { contextMiddleware } = importLazy('../cli/context-middleware');
const { fetchAndStoreModules } = importLazy('../environment/inventory');

function inventoryCommand(argv) {
  if (argv.fetch) {
    return fetchAndStoreModules().then(() => { return Promise.resolve(); });
  }

  return Promise.resolve();
}

module.exports = {
  command: 'inventory',
  describe: 'Manage local inventory cache to supply module data for `stripes workspace`.',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
      ]);
    yargs.option('fetch', {
      describe: 'Fetch module names from Github and store in local cache.',
      type: 'boolean',
      default: true,
    });
    yargs.example('$0 inventory --fetch', 'Fetch module names from Github and store in local cache.');
    return yargs;
  },
  handler: inventoryCommand,
};
