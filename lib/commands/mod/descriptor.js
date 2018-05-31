const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const ModuleService = importLazy('../../okapi/module-service');

function moduleDescriptorCommand(argv, context) {
  const descriptors = ModuleService.getModuleDescriptorsFromContext(context, argv.configFile, argv.strict);

  if (argv.full) {
    console.log(JSON.stringify(descriptors, null, 2));
  } else {
    descriptors.forEach(descriptor => console.log(descriptor.id));
  }
}

module.exports = {
  command: 'descriptor',
  describe: 'Generate module descriptors for an app or platform.',
  builder: (yargs) => {
    yargs
      .option('configFile', {
        describe: 'File containing a Stripes tenant configuration (platform context only)',
        type: 'string',
      })
      .option('full', {
        describe: 'Return full module descriptor JSON',
        type: 'boolean',
        default: false,
      })
      .option('strict', {
        describe: 'Include required interface dependencies',
        type: 'boolean',
        default: false,
      })
      .example('$0 mod descriptor', 'Display module descriptor id for current app')
      .example('$0 mod descriptor --configFile stripes.config.js', 'Display module descriptor ids for platform')
      .example('$0 mod descriptor --full', 'Display full module descriptor as JSON');
    return yargs;
  },
  handler: mainHandler(moduleDescriptorCommand),
};
