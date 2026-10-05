import path from 'path';
import { createRequire } from 'node:module';
import stdinMiddlewareMod from './stdin-middleware.js';
import StripesCliError from './stripes-cli-error.js';
import loggerFactory from './logger.js';

const { stdinJsonMiddleware } = stdinMiddlewareMod;
const logger = loggerFactory('stripesConfigMiddleware');

const requireAny = createRequire(import.meta.url);

function loadStripesConfig(stripesConfigFile) {
  logger.log('loading stripes config file...', stripesConfigFile);
  let config;
  try {
    // import() rejects unknown file extensions; require() loads any extension as JS
    const mod = requireAny(path.resolve(stripesConfigFile));
    config = mod.__esModule ? mod.default : mod;
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

export default {
  stripesConfigMiddleware,
};
