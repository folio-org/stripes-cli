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
  const options = {
    deploy: argv.deploy,
    simulate: argv.simulate,
    preRelease: argv.preRelease
  };
  let descriptorIds = [];

  try {
    // Pull remote module descriptors
    if (argv.remote) {
      console.log(`Pulling latest descriptors from ${argv.remote}...`);
      const pullResponse = await moduleService.pullModuleDescriptorsFromRemote(argv.remote);
      console.log(`  ${pullResponse.length} descriptors added to Okapi.\n`);
    }

    // Generate module descriptors
    console.log(`Generating module descriptors for ${context.moduleName}...`);
    descriptorIds = ModuleService.getModuleDescriptorsFromContext(context, argv.configFile, argv.strict)
      .map(descriptor => descriptor.id);

    // Report on progress
    const originalDescriptorCount = descriptorIds.length;
    console.log(`  ${originalDescriptorCount} descriptor ids found in platform.`);

    // Supplement module descriptors based on existence of other modules in the platform
    descriptorIds = ModuleService.extendModuleDescriptorIds(descriptorIds, argv.include);
    console.log(`  Extended with ${descriptorIds.length - originalDescriptorCount} descriptor ids.\n`);

    // Simulate run with install
    console.log(`Prepare module install for tenant ${argv.tenant} at ${argv.okapi}...`);
    const simulationResponse = await moduleService.installModulesForTenant(descriptorIds, argv.tenant, Object.assign({}, options, { simulate: true }));

    // Report current results
    // TODO: Return summary from service
    const upgrade = simulationResponse.filter(item => item.action === 'enable' && item.from).length;
    const enable = simulationResponse.filter(item => item.action === 'enable' && !item.from).length;
    const upToDate = simulationResponse.filter(item => item.action === 'uptodate').length;
    console.log(`  Actions summary: ${enable} to enable, ${upgrade} to upgrade, ${upToDate} up to date\n`);

    if (options.simulate) {
      console.log('Simulation response:');
      console.log(simulationResponse);
    } else {
      // Deploy back-end
      console.log(`Deploying backend modules for tenant ${argv.tenant} at ${argv.okapi} (this may take a while)...`);
      const deployBackendResponse = await moduleService.deployBackendModulesForTenantWithActions(simulationResponse, argv.tenant, options);
      console.log(deployBackendResponse);
      console.log('\n');

      // Post front-end
      console.log(`Posting frontend modules for tenant ${argv.tenant} at ${argv.okapi}...`);
      const postFrontendResponse = await moduleService.installFrontendModulesForTenantWithActions(simulationResponse, argv.tenant, options);
      console.log(postFrontendResponse);
      console.log('\n');
    }

    // Clean-up
  } catch (error) {
    if (error instanceof OkapiError) {
      const match = descriptorIds.find(id => id === error.message);
      if (match) {
        console.log(`Module descriptor ${error.message} does not exist in Okapi`);
      } else if (error.statusCode < 500 && error.message) {
        console.log(error.message);
      } else {
        console.log('ERROR: Okapi responded with:');
        console.log(`  ${error.statusCode} ${error.statusText}: "${error.message}"`);
      }
    } else {
      Promise.reject(error);
    }
  }
  return Promise.resolve();
}

module.exports = {
  command: 'backend [configFile]',
  describe: 'Initialize Okapi backend for a platform (work in progress)',
  builder: (yargs) => {
    yargs
      .option('simulate', {
        describe: 'Simulate install only (does not deploy)',
        type: 'boolean',
        default: false,
      })
      .option('preRelease', {
        describe: 'Include pre-release modules',
        type: 'boolean',
        default: true,
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
