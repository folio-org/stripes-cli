const context = require('../cli-context');
const packageJson = require('../../package.json');
const generatePlatform = require('../generate-platform');
const StripesPlatform = require('../stripes-platform');
const { applyOptions, stripesConfigOptions } = require('./common-options');

function statusCommand(argv) {
  console.log('Status:');
  console.log(`  version: ${packageJson.version}`);
  console.log(`  context: ${context.type}`);
  console.log(`  module: ${context.moduleName ? context.moduleName : ''}`);
  console.log(`  cli install: ${context.isGlobalCli ? 'global' : 'local'}`);
  console.log(`  stripes-core: ${context.isLocalCoreAvailable ? 'local' : 'cli'}`);

  let stripesConfig;
  const platform = new StripesPlatform();

  if (context.type === 'app') {
    console.log('\nVirtual Platform: (APP CONTEXT)');
    stripesConfig = generatePlatform(context.moduleName, argv);
    console.log(stripesConfig);
  } else if (context.type === 'platform') {
    console.log('\nVirtual Platform: (PLATFORM CONTEXT');
    stripesConfig = generatePlatform('', argv); // TODO: fold into StripesPlatform
    stripesConfig.modules = platform.getPlatformModules();
    console.log(stripesConfig);
  }

  console.log('\nPlatform Aliases:');
  const aliases = platform.getAllAliasesSync();
  const moduleNames = Object.getOwnPropertyNames(aliases);
  for (const moduleName of moduleNames) {
    console.log(`    ${moduleName} --> ${aliases[moduleName]}`);
  }
}

module.exports = {
  command: 'status',
  describe: 'Display Stripes CLI status information',
  builder: (yargs) => {
    yargs
      .option('platform', {
        describe: 'View virtual platform status',
        type: 'string',
        hidden: true, // Not implemented
      });
    return applyOptions(yargs, stripesConfigOptions);
  },
  handler: statusCommand,
};
