module.exports = {
  command: 'okapi <command>',
  describe: 'Okapi commands',
  builder: (yargs) => {
    return yargs.commandDir('okapi-commands');
  },
  handler: () => {},
};
