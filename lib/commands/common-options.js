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
    group: 'Stripes Options:',
  },
  tenant: {
    type: 'string',
    description: 'Specify a tenant ID',
    group: 'Stripes Options:',
  },
  hasAllPerms: {
    type: 'boolean',
    description: 'Set "hasAllPerms" in Stripes config',
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
  publicPath: {
    describe: 'Specify the Webpack publicPath output option',
    type: 'string',
  },
  devtool: {
    type: 'string',
    describe: 'Specify the Webpack devtool for generating source maps',
  },
  lint: {
    type: 'boolean',
    describe: 'Show eslint warnings with build',
  },
  maxChunks: {
    type: 'number',
    describe: 'Limit the number of Webpack chunks in build output',
  },
};
