const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const Okapi = importLazy('../../okapi');
const OkapiError = importLazy('../../okapi/okapi-error');
const ModuleService = importLazy('../../okapi/module-service');
const { applyOptions, okapiRequired, tenantRequired } = importLazy('../common-options');


async function backendInstallCommand(argv, context) {
  if (context.type !== 'platform') {
    console.log('"platform backend" only works in the PLATFORM context');
    return Promise.reject();
  }

  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi, context);
  let descriptorIds = [];

  try {
    // Pull remote module descriptors
    if (argv.remote) {
      console.log(`Pulling latest descriptors from ${argv.remote} ...`);
      const pullResponse = await moduleService.pullModuleDescriptorsFromRemote(argv.remote);
      console.log(`  ${pullResponse.length} descriptors added.\n`);
    }

    // Generate module descriptors
    console.log(`Generating module descriptors for ${context.moduleName} ...`);
    descriptorIds = ModuleService.getModuleDescriptorsFromContext(context, argv.configFile, argv.strict)
      .map(descriptor => descriptor.id);

    // Supplement module descriptors based on existence of other modules in the platform
    descriptorIds = ModuleService.extendModuleDescriptorIds(descriptorIds, argv.include);

    // Report on progress
    descriptorIds.forEach(mod => console.log(`  ${mod}`));
    console.log(`  ${descriptorIds.length} descriptors total.\n`);

    // Simulate run with install
    console.log(`Installing modules for tenant ${argv.tenant} at ${argv.okapi} (simulation) ...`);
    const installResponse = await moduleService.installModulesForTenant(descriptorIds, argv.tenant, true);

    // Report current results
    console.log(installResponse);

    // Cleanup

    return Promise.resolve();
  } catch (error) {
    if (error instanceof OkapiError) {
      const match = descriptorIds.find(id => id === error.message);
      if (match) {
        console.log(`Module descriptor ${error.message} does not exist in Okapi`);
        return Promise.resolve();
      } else if (error.statusCode < 500 && error.message) {
        console.log(error.message);
        return Promise.resolve();
      }
    }
    return Promise.reject(error);
  }
}

module.exports = {
  command: 'backend [configFile]',
  describe: 'Initialize Okapi backend for a platform (work in progress)',
  builder: (yargs) => {
    yargs
      .option('simulate', {
        describe: 'Perform a dry run',
        type: 'boolean'
      })
      .option('remote', {
        describe: 'Update module descriptors via remote before install',
        type: 'string',
      })
      .option('include', {
        describe: 'Additional backend module ids to include with install',
        type: 'array',
      });
    return applyOptions(yargs, Object.assign({}, okapiRequired, tenantRequired));
  },
  handler: mainHandler(backendInstallCommand),
};
