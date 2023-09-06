module.exports = {
  command: 'translate <command>',
  describe: 'Commands to manage translations in UI platforms',
  builder: yargs => yargs.commandDir('translate'),
  handler: () => {},
};
