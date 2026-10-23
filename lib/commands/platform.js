import path from 'path';
import loadCommands from '../cli/load-commands.js';

const subcommands = await loadCommands(path.join(import.meta.dirname, 'platform'));

export default {
  command: 'platform <command>',
  describe: 'Commands to manage stripes UI platforms',
  builder: yargs => yargs.command(subcommands),
  handler: () => {},
};
