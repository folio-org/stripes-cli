import path from 'path';
import loadCommands from '../cli/load-commands.js';

const subcommands = await loadCommands(path.join(import.meta.dirname, 'app'));

export default {
  command: 'app <command>',
  describe: 'Commands to create and manage stripes UI apps',
  builder: yargs => yargs.command(subcommands),
  handler: () => {},
};
