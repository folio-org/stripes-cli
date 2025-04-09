import { compile, pcheck, stats } from './translate/index.js';

export default {
  command: 'translate <command>',
  describe: 'Commands to manage translations in UI platforms',
  // @@builder: yargs => yargs.commandDir('translate'),
  builder: yargs => yargs.command([compile, pcheck, stats]),
  handler: () => {},
};
