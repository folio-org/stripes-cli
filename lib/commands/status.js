const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../cli/main-handler');
const packageJson = importLazy('../../package.json');
const StripesPlatform = importLazy('../platform/stripes-platform');
const PlatformStorage = importLazy('../platform/platform-storage');
const { listAliases } = importLazy('./alias');
const { applyOptions, okapiOptions, stripesConfigOptions } = importLazy('./common-options');
const { configPath, plugins } = importLazy('../cli/config');
const AliasService = importLazy('../platform/alias-service');
const DevelopmentEnvironment = importLazy('../environment/development');
const StripesCore = importLazy('../cli/stripes-core');


function statusCommand(argv, context) {
  console.log('Status:');
  console.log(`  version: ${packageJson.version}`);
  console.log(`  context: ${context.type}`);
  console.log(`  module: ${context.moduleName ? context.moduleName : ''}`);
  console.log(`  global cli: ${context.isGlobalCli}`);
  console.log(`  .stripesclirc: ${configPath || '(none found)'}`);

  const storage = new PlatformStorage();
  console.log(`  storage path: ${storage.getStoragePath()}`);

  const platform = new StripesPlatform(argv.configFile, context, argv);
  const stripes = new StripesCore(context, platform.aliases);
  console.log(`  stripes-core: ${stripes.getCorePath()}`);

  console.log('\nGenerated Stripes Config:');
  console.log(JSON.stringify(platform.getStripesConfig(), null, 2));

  const aliasService = new AliasService();
  let aliasCount = 0;

  console.log('\nAliases from "alias add" command (global):');
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

  if (argv.platform && (context.type === 'workspace' || context.type === 'platform')) {
    const dev = new DevelopmentEnvironment(context.cwd, context.type === 'workspace');
    dev.loadExistingModules();
    const moduleDirs = dev.getModulePaths();

    console.log('\nDevelopment platform paths (includes aliases):');
    moduleDirs.forEach((dir) => {
      console.log(`  ${dir}`);
    });
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
        describe: 'View development platform status',
        type: 'boolean',
      });
    return applyOptions(yargs, Object.assign({}, okapiOptions, stripesConfigOptions));
  },
  handler: mainHandler(statusCommand),
};
