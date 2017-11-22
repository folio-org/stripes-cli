const context = require('../cli-context');
const packageJson = require('../../package.json');
const StripesPlatform = require('../platform/stripes-platform');
const PlatformStorage = require('../platform/platform-storage');
const { listAliases } = require('./alias');
const { applyOptions, stripesConfigOptions } = require('./common-options');
const { configPath, plugins } = require('../cli-config');

function statusCommand(argv) {
  console.log('Status:');
  console.log(`  version: ${packageJson.version}`);
  console.log(`  context: ${context.type}`);
  console.log(`  module: ${context.moduleName ? context.moduleName : ''}`);
  console.log(`  cli install: ${context.isGlobalCli ? 'global' : 'local'}`);
  console.log(`  stripes-core: ${context.isLocalCoreAvailable ? 'local' : 'cli'} dependency`);
  console.log(`  .stripesclirc: ${configPath || '(none found)'}`);

  const storage = new PlatformStorage();
  console.log(`  storage path: ${storage.getStoragePath()}`);

  const platform = new StripesPlatform(argv.config, context);
  if (context.type === 'app') {
    platform.applyVirtualAppPlatform(context.moduleName);
  } else if (context.type === 'platform') {
    platform.applyVirtualPlatform();
  }
  platform.applyCommandOptions(argv);

  console.log('\nGenerated Stripes Config:');
  console.log(JSON.stringify(platform.getStripesConfig(), null, 2));

  console.log('\nPlatform Aliases:');
  const aliases = platform.getAliases();
  const aliasNames = Object.getOwnPropertyNames(aliases);
  listAliases(aliases);

  if (plugins) {
    console.log('\nPlugins:');
    const pluginNames = Object.getOwnPropertyNames(plugins);
    console.log(`  ${pluginNames}`);
  }

  if (!context.isLocalCoreAvailable || aliasNames.length) {
    console.log('\nWARNING: The current configuration may not be suitable for production builds.');
  }
  console.log();
}

module.exports = {
  command: 'status [config]',
  describe: 'Display Stripes CLI status information',
  builder: (yargs) => {
    yargs
      .positional('config', {
        describe: 'File containing a Stripes tenant configuration',
        type: 'string',
      })
      .option('platform', {
        describe: 'View virtual platform status',
        type: 'string',
        hidden: true, // Not implemented
      });
    return applyOptions(yargs, stripesConfigOptions);
  },
  handler: statusCommand,
};
