import { bigtest, create, perms } from './app/index.js';

export default {
  command: 'app <command>',
  describe: 'Commands to create and manage stripes UI apps',
  builder: yargs => yargs.command([bigtest, create, perms]),
  handler: () => {},
};
