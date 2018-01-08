module.exports = {
  command: 'okapi <command>',
  describe: 'Okapi commands',
  builder: yargs => yargs.commandDir('okapi-commands'),
  handler: () => {},
};
