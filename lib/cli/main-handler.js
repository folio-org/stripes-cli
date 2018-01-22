const context = require('./context');

// Main handler returns a command handler used to wrap all Stripes CLI commands.
// It provides consistent context assignment and re-assignment when necessary (when one command calls another)
// TODO: Include error handling and chaining
//
// Usage:
//    handler: mainHandler(loginCommand),
function mainHandler(nextHandler) {
  return (argv, ctx) => {
    const nextCtx = Object.assign({}, ctx, context.getContext(argv.workingDir || ''));
    return nextHandler(argv, nextCtx);
  };
}

module.exports = {
  mainHandler,
};
