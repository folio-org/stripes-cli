export default {
  command: 'app <command>',
  describe: 'Commands to create and manage stripes UI apps',
  builder: yargs => yargs.commandDir('app'),
  handler: () => {},
};
