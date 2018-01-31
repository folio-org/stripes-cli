const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../cli/main-handler');
const packageJson = importLazy('../../package.json');
const StripesPlatform = importLazy('../platform/stripes-platform');
const PlatformStorage = importLazy('../platform/platform-storage');
const { listAliases } = importLazy('./alias');
const { applyOptions, okapiOptions, stripesConfigOptions } = importLazy('./common-options');
const { configPath, plugins } = importLazy('../cli/config');
const AliasService = importLazy('../platform/alias-service');


function statusCommand(argv, context) {
  console.log('Status:');
  console.log(`  version: ${packageJson.version}`);
  console.log(`  context: ${context.type}`);
  console.log(`  module: ${context.moduleName ? context.moduleName : ''}`);
  console.log(`  cli install: ${context.isGlobalCli ? 'global' : 'local'}`);
  console.log(`  stripes-core: ${context.isLocalCoreAvailable ? 'local' : 'cli'} dependency`);
  console.log(`  .stripesclirc: ${configPath || '(none found)'}`);

  const storage = new PlatformStorage();
  console.log(`  storage path: ${storage.getStoragePath()}`);

  const platform = new StripesPlatform(argv.configFile, context, argv);

  console.log('\nGenerated Stripes Config:');
  console.log(JSON.stringify(platform.getStripesConfig(), null, 2));

  const aliasService = new AliasService();
  let aliasCount = 0;

  console.log('\nAliases from "alias add" command:');
  aliasCount += listAliases(aliasService.getStorageAliases());
  console.log('\nAliases from CLI config file:');
  aliasCount += listAliases(aliasService.getConfigAliases());

  if (plugins) {
    console.log('\nCLI Plugins:');
    const pluginNames = Object.getOwnPropertyNames(plugins);
    console.log(`  ${pluginNames}`);
  }

  if (!context.isLocalCoreAvailable || aliasCount) {
    console.log('\nWARNING: The current configuration may not be suitable for production builds.');
  }
  console.log();
}

module.exports = {
  command: 'status [configFile]',
  describe: 'Display Stripes CLI status information',
  builder: (yargs) => {
    yargs
      .positional('configFile', {
        describe: 'File containing a Stripes tenant configuration',
        type: 'string',
      })
      .option('platform', {
        describe: 'View virtual platform status',
        type: 'string',
        hidden: true, // Not implemented
      });
    return applyOptions(yargs, okapiOptions, stripesConfigOptions);
  },
  handler: mainHandler(statusCommand),
};
