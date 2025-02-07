export default {
  command: 'okapi <command>',
  describe: 'Okapi commands (login and logout)',
  builder: yargs => yargs.commandDir('okapi'),
  handler: () => {},
};
