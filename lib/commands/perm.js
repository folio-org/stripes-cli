module.exports = {
  command: 'perm <command>',
  describe: 'Commands to manage UI module permissions',
  builder: yargs => yargs.commandDir('perm'),
  handler: () => {},
};
