import context from './context.js';

// Exposed separately for commands to change context if necessary
export function applyContext(argv) {
  const cliContext = Object.assign({}, context.getContext(argv.workingDir || ''));
  return Object.assign(argv, { context: cliContext });
}

// Context middleware applies CLI context to argv
export function contextMiddleware() {
  return (argv) => {
    return Promise.resolve(applyContext(argv));
  };
}
