// Helper to apply options to the yargs object
// Useful when 'builder' is assigned a function for advanced behavior.
// Not required when 'builder' is assigned an object of options
module.exports.applyOptions = (yargs, options) => {
  for (const prop of Object.getOwnPropertyNames(options)) {
    yargs.options(prop, options[prop]);
  }
  return yargs;
};

module.exports.serverOptions = {
  port: {
    type: 'number',
    describe: 'Development server port',
    default: process.env.STRIPES_PORT || 3000,
    group: 'Server Options:',
  },
  host: {
    type: 'number',
    describe: 'Development server host',
    default: process.env.STRIPES_HOST || 'localhost',
    group: 'Server Options:',
  },
  cache: {
    type: 'boolean',
    describe: 'Use HardSourceWebpackPlugin cache',
    group: 'Server Options:',
  },
};

module.exports.stripesConfigOptions = {
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
    description: 'Set "hasAllPerms" in Stripes config',
    default: true,
    group: 'Stripes Options:',
  },
};

module.exports.buildOptions = {
  prod: {
    type: 'boolean',
    description: 'Use production build settings',
    conflicts: 'dev',
    default: undefined,
  },
  dev: {
    type: 'boolean',
    description: 'Use development build settings',
    conflicts: 'prod',
    default: undefined,
  },
  devtool: {
    type: 'string',
    describe: 'Specify a value for devtool',
  },
};
