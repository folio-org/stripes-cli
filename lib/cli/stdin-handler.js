const getStdin = require('get-stdin');

function stdinStringHandler(name, nextHandler) {
  return (argv, ctx) => {
    return getStdin().then(stdin => {
      if (stdin) {
        argv[name] = stdin;
      }
      return nextHandler(argv, ctx);
    });
  };
}

// Parse stdin as JSON
function stdinJsonHandler(name, nextHandler) {
  return (argv, ctx) => {
    return getStdin().then(stdin => {
      if (stdin) {
        argv[name] = JSON.parse(stdin);
      }
      return nextHandler(argv, ctx);
    });
  };
}

// Parse stdin as an array split on whitespace
function stdinArrayHandler(name, nextHandler) {
  return (argv, ctx) => {
    return getStdin().then(stdin => {
      if (stdin) {
        argv[name] = stdin.trim().split(/\s+/);
      }
      return nextHandler(argv, ctx);
    });
  };
}

// Parse stdin as either JSON or an array of whitespace
function stdinArrayOrJsonHandler(name, nextHandler) {
  return (argv, ctx) => {
    return getStdin().then(stdin => {
      if (stdin) {
        // Simple check for starting character of '{' or '[' to determine how to handle the data
        if (stdin.match(/^\s*[{[]/)) {
          argv[name] = JSON.parse(stdin);
        } else {
          argv[name] = stdin.trim().split(/\s+/);
        }
      }
      return nextHandler(argv, ctx);
    });
  };
}

module.exports = {
  stdinStringHandler,
  stdinJsonHandler,
  stdinArrayHandler,
  stdinArrayOrJsonHandler,
};
