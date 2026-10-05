import contextMiddlewareMod from '../../cli/context-middleware.js';
import stripesConfigMiddlewareMod from '../../cli/stripes-config-middleware.js';
import DescriptorService from '../../okapi/descriptor-service.js';
import commonOptionsMod from '../common-options.js';

const { contextMiddleware } = contextMiddlewareMod;
const { stripesConfigMiddleware } = stripesConfigMiddlewareMod;
const { stripesConfigFile, stripesConfigStdin } = commonOptionsMod;

function moduleDescriptorCommand(argv) {
  const context = argv.context;
  const descriptorService = new DescriptorService(context, argv.stripesConfig);
  const descriptors = descriptorService.getModuleDescriptorsFromContext(argv.strict);

  if (argv.output) {
    DescriptorService.writeModuleDescriptorsToDirectory(descriptors, argv.output);
    console.log(`${descriptors.length} module descriptors written to ${argv.output}`);
  } else if (argv.full) {
    const output = argv.single && descriptors.length === 1 ? descriptors[0] : descriptors;
    console.log(JSON.stringify(output, null, 2));
  } else {
    descriptors.forEach(descriptor => console.log(descriptor.id));
  }
}

export default {
  command: 'descriptor [configFile]',
  describe: 'Generate module descriptors for an app or platform.',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
        stripesConfigMiddleware(),
      ])
      .positional('configFile', stripesConfigFile.configFile)
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
      .option('single', {
        describe: 'Full JSON descriptor for a single module in the current working directory',
        type: 'boolean',
        default: false,
      })
      .option('output', {
        describe: 'Directory to write descriptors to as JSON files',
        type: 'string',
      })
      .options(stripesConfigStdin)
      .example('$0 mod descriptor', 'Display module descriptor id for current app')
      .example('$0 mod descriptor stripes.config.js', 'Display module descriptor ids for platform')
      .example('$0 mod descriptor --full', 'Display full module descriptor as JSON');
  },
  handler: moduleDescriptorCommand,
};
