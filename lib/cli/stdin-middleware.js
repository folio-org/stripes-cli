import getStdinWrapper from './stdin.js';
import getLogger from './logger.js';

const logger = getLogger('stdinMiddleware');

export function stdinStringMiddleware(name) {
  return (argv) => {
    return getStdinWrapper.getStdin().then(stdin => {
      if (stdin) {
        logger.log(`read string from stdin for key "${name}"`);
        argv[name] = stdin;
      }
      return argv;
    });
  };
}

export function stdinJsonMiddleware(name) {
  return (argv) => {
    return getStdinWrapper.getStdin().then(stdin => {
      if (stdin) {
        logger.log(`parsing JSON from stdin for key "${name}"`);
        argv[name] = JSON.parse(stdin);
      }
      return argv;
    });
  };
}

export function stdinArrayMiddleware(name) {
  return (argv) => {
    return getStdinWrapper.getStdin().then(stdin => {
      if (stdin) {
        logger.log(`parsing array from stdin for key "${name}"`);
        argv[name] = stdin.trim().split(/\s+/);
      }
      return argv;
    });
  };
}

export function stdinArrayOrJsonMiddleware(name) {
  return (argv) => {
    return getStdinWrapper.getStdin().then(stdin => {
      if (stdin) {
        // Simple check for starting character of '{' or '[' to determine how to handle the data
        if (stdin.match(/^\s*[{[]/)) {
          logger.log(`parsing JSON from stdin for key "${name}"`);
          argv[name] = JSON.parse(stdin);
        } else {
          logger.log(`parsing array from stdin for key "${name}"`);
          argv[name] = stdin.trim().split(/\s+/);
        }
      }
      return argv;
    });
  };
}

export default {
  stdinStringMiddleware,
  stdinJsonMiddleware,
  stdinArrayMiddleware,
  stdinArrayOrJsonMiddleware,
};
