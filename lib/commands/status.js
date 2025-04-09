import path from 'path';
import fs from 'fs-extra';

import { contextMiddleware } from '../cli/context-middleware.js';
import { stripesConfigMiddleware } from '../cli/stripes-config-middleware.js';
import StripesPlatform from '../platform/stripes-platform.js';
import PlatformStorage from '../platform/platform-storage.js';
import { listAliases } from './alias.js';
import { okapiOptions, stripesConfigFile, stripesConfigStdin, stripesConfigOptions } from './common-options.js';
import cliConfig from '../cli/config.js';
import AliasService from '../platform/alias-service.js';
import DevelopmentEnvironment from '../environment/development.js';
import StripesCore from '../cli/stripes-core.js';

const { configPath, plugins } = { cliConfig };

const pkgPath = path.join(import.meta.dirname, '..', '..', 'package.json');
const packageJson = fs.readJsonSync(pkgPath, { throws: false });

function statusCommand(argv) {
  const context = argv.context;
  console.log('Status:');
  console.log(`  version: ${packageJson.version}`);
  console.log(`  context: ${context.actsAs || context.type}`);
  console.log(`  module: ${context.moduleName ? context.moduleName : ''}`);
  console.log(`  global cli: ${context.isGlobalCli}`);
  console.log(`  .stripesclirc: ${configPath || '(none found)'}`);

  const storage = new PlatformStorage();
  console.log(`  storage path: ${storage.getStoragePath()}`);

  const platform = new StripesPlatform(argv.stripesConfig, context, argv);
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

  if (argv.platform && (context.isWorkspace || context.isPlatform)) {
    const dev = new DevelopmentEnvironment(context.cwd, context.isWorkspace);
    dev.loadExistingModules();
    const moduleDirs = dev.getModulePaths();

    console.log('\nDevelopment platform paths (includes aliases):');
    moduleDirs.forEach((dir) => {
      console.log(`  ${dir}`);
    });
  }

  console.log();
}

export default {
  command: 'status [configFile]',
  describe: 'Display Stripes CLI status information',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
        stripesConfigMiddleware(),
      ])
      .positional('configFile', stripesConfigFile.configFile)
      .option('platform', {
        describe: 'View development platform status',
        type: 'boolean',
      })
      .options(Object.assign({}, okapiOptions, stripesConfigStdin, stripesConfigOptions));
  },
  handler: statusCommand,
};
