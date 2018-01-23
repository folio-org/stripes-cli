const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../cli/main-handler');
const createAppCommand = importLazy('./app/create');


function newCommand(argv) {
  if (argv.item !== 'app') {
    console.log('Only "app" modules are currently supported');
    return Promise.resolve();
  }
  return createAppCommand.handler(argv);
}

module.exports = {
  command: 'new <item> <name>',
  describe: 'Create a new Stripes module. Alias for "app create"',
  builder: (yargs) => {
    yargs
      .positional('item', {
        describe: 'Item to create',
        type: 'string',
        choices: ['app', 'plugin', 'platform', 'test'],
      })
      .positional('name', {
        describe: 'Name of item',
        type: 'string',
      })
      .option('install', {
        describe: 'Yarn install dependencies',
        type: 'boolean',
      })
      .example('$0 new app "Hello World"', 'Create new Stripes UI app and directory')
      .example('$0 new app "Hello World" --install', 'Create new Stripes UI app, directory, and install dependencies');
    return yargs;
  },
  handler: mainHandler(newCommand),
};
