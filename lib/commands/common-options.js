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
    default: 3000,
    group: 'Server Options:',
  },
  host: {
    type: 'string',
    describe: 'Development server host',
    default: 'localhost',
    group: 'Server Options:',
  },
  cache: {
    type: 'boolean',
    describe: 'Use HardSourceWebpackPlugin cache',
    group: 'Server Options:',
  },
};

module.exports.authOptions = {
  username: {
    type: 'string',
    describe: 'Okapi tenant username',
    group: 'Okapi Options:',
  },
  password: {
    type: 'string',
    describe: 'Okapi tenant password',
    group: 'Okapi Options:',
    inquirer: {
      type: 'password',
      mask: '*',
    },
  },
};

module.exports.okapiOptions = {
  okapi: {
    type: 'string',
    describe: 'Specify an Okapi URL',
    group: 'Okapi Options:',
  },
  tenant: {
    type: 'string',
    describe: 'Specify a tenant ID',
    group: 'Okapi Options:',
  },
};

module.exports.stripesConfigOptions = {
  hasAllPerms: {
    type: 'boolean',
    describe: 'Set "hasAllPerms" in Stripes config',
    group: 'Stripes Options:',
  },
};

module.exports.buildOptions = {
  prod: {
    type: 'boolean',
    describe: 'Use production build settings',
    conflicts: 'dev',
    default: undefined,
  },
  dev: {
    type: 'boolean',
    describe: 'Use development build settings',
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
