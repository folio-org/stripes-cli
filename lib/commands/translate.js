import path from 'path';
import loadCommands from '../cli/load-commands.js';

const subcommands = await loadCommands(path.join(import.meta.dirname, 'translate'));

export default {
  command: 'translate <command>',
  describe: 'Commands to manage translations in UI platforms',
  builder: yargs => yargs.command(subcommands),
  handler: () => {},
};
