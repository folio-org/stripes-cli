import { contextMiddleware } from '../../cli/context-middleware.js';
import { stripesConfigMiddleware } from '../../cli/stripes-config-middleware.js';
import Okapi from '../../okapi';
import OkapiError from '../../okapi/okapi-error.js';
import ModuleService from '../../okapi/module-service.js';
import DescriptorService from '../../okapi/descriptor-service.js';
import PermissionService from '../../okapi/permission-service.js';
import { okapiRequired, tenantRequired, stripesConfigFile, stripesConfigStdin } from '../common-options.js';


function displayActionResults(response, isDetailView, isSimulation) {
  const upgrade = response.filter(item => item.action === 'enable' && item.from).length;
  const enable = response.filter(item => item.action === 'enable' && !item.from).length;
  const upToDate = response.filter(item => item.action === 'uptodate').length;

  if (isDetailView) {
    console.log(response);
    console.log();
  } else if (isSimulation) {
    console.log(`  Summary: ${enable} to enable, ${upgrade} to upgrade, ${upToDate} up to date.\n`);
  } else {
    console.log(`  Summary: ${enable} enabled, ${upgrade} upgraded, ${upToDate} up to date.\n`);
  }
}

async function backendInstallCommand(argv) {
  const context = argv.context;
  if (!context.isPlatform) {
    console.log('"platform backend" only works in the PLATFORM context');
    return Promise.reject();
  }

  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi);
  const permissionService = new PermissionService(okapi);
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
    const descriptorService = new DescriptorService(context, argv.stripesConfig);
    descriptorIds = descriptorService.getModuleDescriptorsFromContext().map(descriptor => descriptor.id);
    const originalDescriptorCount = descriptorIds.length;

    // Supplement module descriptors based on existence of other modules in the platform
    descriptorIds = DescriptorService.extendModuleDescriptorIds(descriptorIds, argv.include);
    if (argv.detail) {
      console.log(descriptorIds);
      console.log();
    } else {
      console.log(`  Summary: ${originalDescriptorCount} platform descriptor ids, ${descriptorIds.length - originalDescriptorCount} extended descriptor ids.\n`);
    }

    // Simulate run with install
    console.log(`Prepare module install for tenant ${argv.tenant} at ${argv.okapi}...`);
    const simulationResponse = await moduleService.simulateInstallModulesForTenant(descriptorIds, argv.tenant, options);
    displayActionResults(simulationResponse, argv.detail, true);

    // End here if we're only simulating
    if (options.simulate) {
      return Promise.resolve();
    }

    // Deploy back-end
    console.log(`Deploying backend modules for tenant ${argv.tenant} at ${argv.okapi} (this may take a while)...`);
    const deployBackendResponse = await moduleService.deployBackendModulesForTenantWithActions(simulationResponse, argv.tenant, options);
    displayActionResults(deployBackendResponse, argv.detail);

    // Post front-end
    console.log(`Posting frontend modules for tenant ${argv.tenant} at ${argv.okapi}...`);
    const postFrontendResponse = await moduleService.installFrontendModulesForTenantWithActions(simulationResponse, argv.tenant, options);
    displayActionResults(postFrontendResponse, argv.detail);

    // Assign permission to a user
    if (argv.user) {
      const permissionsAssigned = await permissionService.assignAllTenantPermissionsToUser(argv.tenant, argv.user);
      if (permissionsAssigned.length && argv.detail) {
        permissionsAssigned.forEach(perm => console.log(`User ${argv.assign} assigned permission ${perm}`));
      } else {
        console.log(`User ${argv.user} assigned ${permissionsAssigned.length} permissions`);
      }
    }
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

export default {
  command: 'backend <configFile>',
  describe: 'Initialize Okapi backend for a platform',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
        stripesConfigMiddleware(),
      ])
      .positional('configFile', stripesConfigFile.configFile)
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
        describe: 'Pull module descriptors from remote registry before install',
        type: 'string',
      })
      .option('include', {
        describe: 'Additional module ids to include with install',
        type: 'array',
      })
      .option('detail', {
        describe: 'Display detailed output',
        type: 'boolean',
        default: false,
      })
      .option('user', {
        describe: 'Username to assign permission to',
        type: 'string',
      })
      .options(Object.assign({}, okapiRequired, tenantRequired, stripesConfigStdin))
      .example('$0 platform backend stripes.config.js', 'Deploy, enable, and/or upgrade modules to support the current platform')
      .example('$0 platform backend stripes.config.js --simulate --detail', 'View modules that need to enabled/upgraded for the current platform')
      .example('$0 platform backend stripes.config.js --remote http://folio-registry.aws.indexdata.com', 'Pull module descriptors from remote Okapi prior to install')
      .example('$0 platform backend stripes.config.js --include one two', 'Include modules "one" and "two" not specified in tenant config');
  },
  handler: backendInstallCommand,
};
