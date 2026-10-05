import path from 'path';
import loadCommands from '../cli/load-commands.js';

const subcommands = await loadCommands(path.join(import.meta.dirname, 'perm'));

export default {
  command: 'perm <command>',
  describe: 'Commands to manage UI module permissions',
  builder: yargs => yargs.command(subcommands),
  handler: () => {},
};
