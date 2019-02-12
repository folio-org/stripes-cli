const stdinWrapper = require('./stdin');
const logger = require('./logger')('stdinMiddleware');

function stdinStringMiddleware(name) {
  return (argv) => {
    return stdinWrapper.getStdin().then(stdin => {
      if (stdin) {
        logger.log(`read string from stdin for key "${name}"`);
        argv[name] = stdin;
      }
      return argv;
    });
  };
}

function stdinJsonMiddleware(name) {
  return (argv) => {
    return stdinWrapper.getStdin().then(stdin => {
      if (stdin) {
        logger.log(`parsing JSON from stdin for key "${name}"`);
        argv[name] = JSON.parse(stdin);
      }
      return argv;
    });
  };
}

function stdinArrayMiddleware(name) {
  return (argv) => {
    return stdinWrapper.getStdin().then(stdin => {
      if (stdin) {
        logger.log(`parsing array from stdin for key "${name}"`);
        argv[name] = stdin.trim().split(/\s+/);
      }
      return argv;
    });
  };
}

function stdinArrayOrJsonMiddleware(name) {
  return (argv) => {
    return stdinWrapper.getStdin().then(stdin => {
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

module.exports = {
  stdinStringMiddleware,
  stdinJsonMiddleware,
  stdinArrayMiddleware,
  stdinArrayOrJsonMiddleware,
};
