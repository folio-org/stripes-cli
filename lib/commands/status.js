const context = require('../cli-context');
const packageJson = require('../../package.json');

function statusCommand(argv) {
  console.log('Status:');
  console.log(`  version: ${packageJson.version}`);
  console.log(`  context: ${context.type}`);
  console.log(`  module: ${context.moduleName}`);
  console.log(`  installed: ${context.isGlobalCli ? 'globally' : 'locally'}`);

  if (argv.platform) {
    // TODO: generate platform and display config
    console.log('Information about the virtual platform');
  }

  // TODO: Display module alias information
}

module.exports = {
  command: 'status',
  describe: 'Display Stripes CLI status information',
  builder: yargs => yargs
    .option('platform', {
      describe: 'View virtual platform status',
      type: 'boolean',
    }),
  handler: statusCommand,
};
