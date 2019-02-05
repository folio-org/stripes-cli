const stdinWrapper = require('./stdin');

function stdinStringMiddleware(name) {
  return (argv) => {
    return stdinWrapper.getStdin().then(stdin => {
      if (stdin) {
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
          argv[name] = JSON.parse(stdin);
        } else {
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
