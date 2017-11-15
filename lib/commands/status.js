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
  console.log(`  stripes-core: ${context.isLocalCoreAvailable ? 'local' : 'cli'} dependency`);

  let stripesConfig;
  const platform = new StripesPlatform();
  console.log(`  storage path: ${platform.getStoragePath()}`);

  if (context.type === 'app') {
    console.log('\nVirtual Platform: (APP CONTEXT)');
    stripesConfig = generatePlatform(context.moduleName, argv);
    console.log(stripesConfig);
  } else if (context.type === 'platform') {
    console.log('\nVirtual Platform: (PLATFORM CONTEXT)');
    stripesConfig = generatePlatform('', argv); // TODO: fold into StripesPlatform
    stripesConfig.modules = platform.getPlatformModules();
    console.log(JSON.stringify(stripesConfig, null, 2));
  }

  console.log('\nPlatform Aliases:');
  const aliases = platform.getAllAliasesSync();
  const aliasNames = Object.getOwnPropertyNames(aliases);
  if (aliasNames.length) {
    // TODO: Check to see if any aliases are broken
    for (const name of aliasNames) {
      console.log(`  ${name} --> ${aliases[name]}`);
    }
  } else {
    console.log('  (none set)');
  }

  if (!context.isLocalCoreAvailable || aliasNames.length) {
    console.log('\nWARNING: The current configuration is not suitable for production builds.');
  }
  console.log();
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
