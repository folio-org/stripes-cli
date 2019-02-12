const context = require('./context');

// Exposed separately for commands to change context if necessary
function applyContext(argv) {
  const cliContext = Object.assign({}, context.getContext(argv.workingDir || ''));
  return Object.assign(argv, { context: cliContext });
}

// Context middleware applies CLI context to argv
function contextMiddleware() {
  return (argv) => {
    return Promise.resolve(applyContext(argv));
  };
}

module.exports = {
  applyContext,
  contextMiddleware,
};
