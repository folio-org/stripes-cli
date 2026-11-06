import contextMiddlewareMod from '../../cli/context-middleware.js';
import stripesConfigMiddlewareMod from '../../cli/stripes-config-middleware.js';
import KarmaService from '../../test/karma-service.js';
import StripesPlatform from '../../platform/stripes-platform.js';
import commonOptionsMod from '../common-options.js';
import StripesCore from '../../cli/stripes-core.js';

const { contextMiddleware } = contextMiddlewareMod;
const { stripesConfigMiddleware } = stripesConfigMiddlewareMod;
const { serverOptions, okapiOptions, stripesConfigFile, stripesConfigStdin, stripesConfigOptions } = commonOptionsMod;

// Karma has been replaced by Playwright. This command remains so that existing scripts keep working;
// Karma-specific options (--karma.*) are ignored.
function karmaCommand(argv) {
  console.warn('"stripes test karma" is deprecated: Karma has been replaced by Playwright. Running "stripes test playwright" instead.');
  if (argv.karma) {
    console.warn('The --karma.* options are not supported and have been ignored.');
  }
  return playwrightCommand.handler(argv);
}

export default {
  command: 'karma [configFile]',
  describe: false, // deprecated, hidden from help
  builder: (yargs) => {
    playwrightCommand.builder(yargs);
    yargs
      .option('karma', { hidden: true })
      .option('karma.browsers', { type: 'array', hidden: true })
      .option('karma.reporters', { type: 'array', hidden: true });
  },
  handler: karmaCommand,
};
