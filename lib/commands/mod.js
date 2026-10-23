import path from 'path';
import loadCommands from '../cli/load-commands.js';

const subcommands = await loadCommands(path.join(import.meta.dirname, 'mod'));

export default {
  command: 'mod <command>',
  describe: 'Commands to manage UI module descriptors',
  builder: yargs => yargs.command(subcommands),
  handler: () => {},
};
