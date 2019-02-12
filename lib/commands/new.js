const importLazy = require('import-lazy')(require);

const { contextMiddleware } = importLazy('../cli/context-middleware');
const createAppCommand = importLazy('./app/create');

// TODO: Assess usage and possibly deprecate
function newCommand(argv) {
  if (argv.item !== 'app') {
    console.log('Only "app" modules are currently supported');
    return Promise.resolve();
  }
  return createAppCommand.handler(argv);
}

module.exports = {
  command: 'new <item> <name>',
  describe: 'Create a new Stripes module',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
      ])
      .positional('item', {
        describe: 'Item to create',
        type: 'string',
        choices: ['app', 'plugin', 'platform', 'test'],
      })
      .positional('name', {
        describe: 'Name of item',
        type: 'string',
      })
      .example('$0 new app "Hello World"', 'Alias for "app create"');
    return yargs;
  },
  handler: newCommand,
};
