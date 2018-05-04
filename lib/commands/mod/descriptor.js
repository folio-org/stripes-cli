const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const ModuleService = importLazy('../../okapi/module-service');

function moduleDescriptorCommand(argv, context) {
  const descriptors = ModuleService.getModuleDescriptorsFromContext(context, argv.configFile);

  if (argv.full) {
    console.log(JSON.stringify(descriptors, null, 2));
  } else {
    descriptors.forEach(descriptor => console.log(descriptor.id));
  }

  return Promise.resolve(descriptors);
}

module.exports = {
  command: 'descriptor',
  describe: 'Generate module descriptors for an app or platform',
  builder: (yargs) => {
    yargs
      .positional('configFile', {
        describe: 'File containing a Stripes tenant configuration',
        type: 'string',
      })
      .option('full', {
        describe: 'Return full module descriptor JSON',
        type: 'boolean',
        default: false,
      })
      .example('$0 mod descriptor', '')
      .example('$0 mod descriptor --full', '');
    return yargs;
  },
  handler: mainHandler(moduleDescriptorCommand),
};
