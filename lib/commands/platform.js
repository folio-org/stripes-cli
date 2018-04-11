module.exports = {
  command: 'platform <command>',
  describe: 'Commands to manage stripes UI platforms',
  builder: yargs => yargs.commandDir('platform'),
  handler: () => {},
};
