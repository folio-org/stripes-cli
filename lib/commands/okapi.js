import path from 'path';
import loadCommands from '../cli/load-commands.js';

const subcommands = await loadCommands(path.join(import.meta.dirname, 'okapi'));

export default {
  command: 'okapi <command>',
  describe: 'Okapi commands (login and logout)',
  builder: yargs => yargs.command(subcommands),
  handler: () => {},
};
