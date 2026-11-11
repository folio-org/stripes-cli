import browserCommand from './browser.js';

// Karma has been replaced by Playwright. This command remains so that existing scripts keep working;
// Karma-specific options (--karma.*) are ignored.
function karmaCommand(argv) {
  console.warn('"stripes test karma" is deprecated: Karma has been replaced by Playwright. Running "stripes test browser" instead.');
  if (argv.karma) {
    console.warn('The --karma.* options are not supported and have been ignored.');
  }
  return browserCommand.handler(argv);
}

export default {
  command: 'karma [configFile]',
  describe: false, // deprecated, hidden from help
  builder: (yargs) => {
    browserCommand.builder(yargs);
    yargs
      .option('karma', { hidden: true })
      .option('karma.browsers', { type: 'array', hidden: true })
      .option('karma.reporters', { type: 'array', hidden: true });
  },
  handler: karmaCommand,
};
