import Okapi from '../../okapi/index.js';
import OkapiError from '../../okapi/okapi-error.js';
import ModuleService from '../../okapi/module-service.js';
import { moduleIdsStdin, okapiRequired, tenantRequired } from '../common-options.js';
import { stdinArrayOrJsonMiddleware } from '../../cli/stdin-middleware.js';


function installModulesCommand(argv) {
  if (!argv.ids) {
    console.log('No module descriptor ids specified.');
    return Promise.resolve();
  }

  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi);
  const options = {
    deploy: argv.deploy,
    simulate: argv.simulate,
    preRelease: argv.preRelease,
    action: argv.action,
  };

  const promise = options.simulate
    ? moduleService.simulateInstallModulesForTenant(argv.ids, argv.tenant, options)
    : moduleService.installModulesForTenant(argv.ids, argv.tenant, options);

  return promise
    .then((response) => {
      try {
        console.log(JSON.stringify(response, null, 2));
      } catch (err) {
        console.error(err);
        console.log(response);
      }
    })
    .catch((error) => {
      if (error instanceof OkapiError) {
        const match = argv.ids.find(id => id === error.message);
        if (match) {
          console.log(`Module descriptor ${error.message} does not exist in Okapi`);
        } else if (error.statusCode < 500 && error.message) {
          console.log(error.message);
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    });
}

export default {
  command: 'install',
  describe: 'Enable, disable, and optionally deploy one or more modules for a tenant in Okapi',
  builder: (yargs) => {
    yargs
      .middleware([
        stdinArrayOrJsonMiddleware('ids'),
      ])
      .option('simulate', {
        describe: 'Simulate operation',
        type: 'boolean',
        default: false,
      })
      .option('action', {
        describe: 'Action to perform on modules',
        type: 'string',
        choices: ['enable', 'disable'],
        default: 'enable',
      })
      .option('deploy', {
        describe: 'Deploy modules',
        type: 'boolean',
        default: false,
      })
      .option('preRelease', {
        describe: 'Include pre-release modules',
        type: 'boolean',
        default: true,
      })
      .options(Object.assign({}, moduleIdsStdin, okapiRequired, tenantRequired))
      .example('$0 mod install --ids one two --tenant diku --deploy', 'Install and deploy module ids "one" and "two"')
      .example('$0 mod install --ids one two --tenant diku --action disable', 'Disable module ids "one" and "two"')
      .example('echo one two | $0 mod install --tenant diku', 'Install module ids "one" and "two" using stdin');
  },
  handler: installModulesCommand,
};
