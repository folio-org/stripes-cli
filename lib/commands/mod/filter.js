const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const Okapi = importLazy('../../okapi');
const ModuleService = importLazy('../../okapi/module-service');
const { stdinArrayOrJsonHandler } = importLazy('../../cli/stdin-handler');


function filterModulesCommand(argv, context) {
  const okapi = new Okapi(argv.okapi, argv.tenant);
  const moduleService = new ModuleService(okapi, context);

  if (!argv.front && !argv.back) {
    console.log('A filter must be specified');
    return;
  }

  const filtered = argv.front
    ? moduleService.filterFrontendModules(argv.ids)
    : moduleService.filterBackendModules(argv.ids);

  // Supports both an array of ids as well as an array of objects with actions
  if (filtered[0].id) {
    console.log(JSON.stringify(filtered, null, 2));
  } else {
    filtered.forEach(mod => console.log(mod));
  }
}

module.exports = {
  command: 'filter',
  describe: 'Filter module descriptors',
  builder: (yargs) => {
    yargs
      .option('front', {
        describe: 'Front-end modules only',
        type: 'boolean',
        conflicts: 'back',
        default: undefined,
      })
      .option('back', {
        describe: 'Back-end modules only',
        type: 'boolean',
        conflicts: 'front',
        default: undefined,
      })
      .example('echo mod-one folio_two $0 mod filter --front', 'Filter front-end module ids')
      .example('echo mod-one folio_two $0 mod filter --back', 'Filter back-end module ids');
    return yargs;
  },
  handler: mainHandler(stdinArrayOrJsonHandler('ids', filterModulesCommand)),
};
