// Helper to apply options to the yargs object
// Useful when 'builder' is assigned a function for advanced behavior.
// Not required when 'builder' is assigned an object of options
function applyOptions(yargs, options) {
  for (const prop of Object.getOwnPropertyNames(options)) {
    yargs.options(prop, options[prop]);
  }
  return yargs;
}

module.exports.serverOptions = {
  port: {
    type: 'number',
    describe: 'development server port',
    default: process.env.STRIPES_PORT || 3000,
    group: 'Server Options:',
  },
  host: {
    type: 'number',
    describe: 'development server host',
    default: process.env.STRIPES_HOST || 'localhost',
    group: 'Server Options:',
  },
  cache: {
    type: 'boolean',
    describe: 'Use HardSourceWebpackPlugin cache',
    group: 'Server Options:',
  },
  devtool: {
    type: 'string',
    describe: 'Use another value for devtool instead of "inline-source-map"',
    group: 'Server Options:',
  },
};

module.exports.stripesConfigOptions = {
  configFile: {
    describe: 'Path to and name of Stripes configuration file',
    type: 'string',
  },
  okapi: {
    type: 'string',
    description: 'Specify an OKAPI URL',
    default: 'http://localhost:9130',
    group: 'Stripes Options:',
  },
  tenant: {
    type: 'string',
    description: 'Specify a tenant ID',
    default: 'diku',
    group: 'Stripes Options:',
  },
  hasAllPerms: {
    type: 'boolean',
    description: 'Enables the "hasAllPerms" flag in the UI for development.',
    default: true,
    group: 'Stripes Options:',
  },
};
