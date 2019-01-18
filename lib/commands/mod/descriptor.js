const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const DescriptorService = importLazy('../../okapi/descriptor-service');

function moduleDescriptorCommand(argv, context) {
  const descriptorService = new DescriptorService(context, argv.configFile);
  const descriptors = descriptorService.getModuleDescriptorsFromContext(argv.strict);

  if (argv.output) {
    DescriptorService.writeModuleDescriptorsToDirectory(descriptors, argv.output);
    console.log(`${descriptors.length} module descriptors written to ${argv.output}`);
  } else if (argv.full) {
    console.log(JSON.stringify(descriptors, null, 2));
  } else {
    descriptors.forEach(descriptor => console.log(descriptor.id));
  }
}

module.exports = {
  command: 'descriptor [configFile]',
  describe: 'Generate module descriptors for an app or platform.',
  builder: (yargs) => {
    yargs
      .positional('configFile', {
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
      .option('output', {
        describe: 'Directory to write descriptors to as JSON files',
        type: 'string',
      })
      .example('$0 mod descriptor', 'Display module descriptor id for current app')
      .example('$0 mod descriptor stripes.config.js', 'Display module descriptor ids for platform')
      .example('$0 mod descriptor --full', 'Display full module descriptor as JSON');
    return yargs;
  },
  handler: mainHandler(moduleDescriptorCommand),
};
