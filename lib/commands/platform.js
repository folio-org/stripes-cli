module.exports = {
  command: 'platform <command>',
  describe: 'Commands to create and manage stripes UI platforms',
  builder: yargs => yargs.commandDir('platform'),
  handler: () => {},
};
