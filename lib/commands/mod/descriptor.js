const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const ModuleService = importLazy('../../okapi/module-service');

function moduleDescriptorCommand(argv, context) {
  const descriptors = ModuleService.getModuleDescriptorsFromContext(context, argv.configFile);

  if (argv.ids) {
    descriptors.forEach(descriptor => console.log(descriptor.id));
  } else {
    console.log(JSON.stringify(descriptors, null, 2));
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
      .option('ids', {
        describe: 'Only return module ids',
        type: 'boolean',
        default: false,
      })
      .example('$0 mod descriptor', '')
      .example('$0 mod descriptor --ids', '');
    return yargs;
  },
  handler: mainHandler(moduleDescriptorCommand),
};
