module.exports = {
  command: 'mod <command>',
  describe: 'Commands to manage UI module descriptors',
  builder: yargs => yargs.commandDir('mod'),
  handler: () => {},
};
