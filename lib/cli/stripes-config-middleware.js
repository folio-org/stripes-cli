const path = require('path');
const { stdinJsonMiddleware } = require('./stdin-middleware');
const StripesCliError = require('./stripes-cli-error');
const logger = require('./logger')('stripesConfigMiddleware');


function loadStripesConfig(stripesConfigFile) {
  logger.log('loading stripes config file...', stripesConfigFile);
  let config;
  try {
    config = require(path.resolve(stripesConfigFile)); // eslint-disable-line
  } catch (err) {
    console.error(err);
    throw new StripesCliError(`Unable to load ${stripesConfigFile}`);
  }
  return config;
}

async function readStripesConfigStdin() {
  const stdin = await stdinJsonMiddleware('config')({});
  if (stdin.config) {
    logger.log('read stripes config from stdin');
  }
  return stdin.config || undefined;
}

// Given a "--configFile" has been provided, this middleware will load the stripes configuration from disk
// and make the stripes configuration object available to the command as "argv.stripesConfig"
// If no configFile has been provided, stdin is checked for JSON input
function stripesConfigMiddleware(fileOnly) {
  return async function middleware(argv) {
    logger.log('initializing...');
    let stripesConfig;

    if (argv.configFile) {
      stripesConfig = loadStripesConfig(argv.configFile);
    } else if (!fileOnly) {
      stripesConfig = await readStripesConfigStdin();
    }

    if (stripesConfig) {
      argv.stripesConfig = stripesConfig;

      // Assign okapi values to argv if not already present
      if (stripesConfig.okapi) {
        if (stripesConfig.okapi.url && !argv.okapi) {
          logger.log(`setting argv.okapi with "${stripesConfig.okapi.url}" from ${argv.configFile || 'stdin'}`);
          argv.okapi = stripesConfig.okapi.url;
        }
        if (stripesConfig.okapi.tenant && !argv.tenant) {
          logger.log(`setting argv.tenant with "${stripesConfig.okapi.tenant}" from ${argv.configFile || 'stdin'}`);
          argv.tenant = stripesConfig.okapi.tenant;
        }
      }
    }

    return Promise.resolve(argv);
  };
}

module.exports = {
  stripesConfigMiddleware,
};
