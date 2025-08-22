import { contextMiddleware } from '../cli/context-middleware.js';
import createAppCommand from './app/create.js';

// TODO: Assess usage and possibly deprecate
function newCommand(argv) {
  if (argv.item !== 'app') {
    console.log('Only "app" modules are currently supported');
    return Promise.resolve();
  }
  return createAppCommand.handler(argv);
}

export default {
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
