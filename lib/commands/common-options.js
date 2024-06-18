module.exports.serverOptions = {
  port: {
    type: 'number',
    describe: 'Development server port',
    default: 3000,
    group: 'Server Options:',
  },
  startProxy: {
    type: 'boolean',
    describe: 'Start a proxy server',
    default: false,
    group: 'Server Options:',
  },
  proxyPort: {
    type: 'number',
    describe: 'Proxy server port',
    default: 3010,
    group: 'Server Options:',
  },
  host: {
    type: 'string',
    describe: 'Development server host',
    default: 'localhost',
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

const okapiOptions = {
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

module.exports.okapiOptions = okapiOptions;

module.exports.okapiOption = {
  okapi: okapiOptions.okapi,
};

module.exports.tenantOption = {
  tenant: okapiOptions.tenant,
};

module.exports.okapiRequired = {
  okapi: Object.assign({}, okapiOptions.okapi, { required: true }),
};

module.exports.tenantRequired = {
  tenant: Object.assign({}, okapiOptions.tenant, { required: true }),
};

module.exports.moduleIdsStdin = {
  ids: {
    describe: 'Module descriptor ids (stdin)',
    type: 'array',
  }
};

// When applied as a positional, "configFile" is the first parameter:
//    yargs.positional('configFile', stripesConfigFile.configFile)
module.exports.stripesConfigFile = {
  configFile: {
    type: 'string',
    describe: 'File containing a Stripes tenant configuration',
    applyAsPositional: true,
    conflicts: 'stripesConfig'
  },
};

module.exports.stripesConfigStdin = {
  stripesConfig: {
    type: 'string',
    describe: 'Stripes config JSON (stdin)',
    conflicts: 'configFile',
  },
};

module.exports.stripesConfigOptions = {
  hasAllPerms: {
    type: 'boolean',
    describe: 'Set "hasAllPerms" in Stripes config',
  },
  languages: {
    type: 'array',
    describe: 'Languages to include in tenant build',
  }
};

module.exports.buildOptions = {
  // prod: {
  //   type: 'boolean',
  //   describe: 'Use production build settings',
  //   conflicts: 'dev',
  //   default: undefined,
  // },
  // dev: {
  //   type: 'boolean',
  //   describe: 'Use development build settings',
  //   conflicts: 'prod',
  //   default: undefined,
  // },
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
  cache: {
    type: 'boolean',
    describe: 'Use webpack cache',
    default: true,
  },
};

const pathOptions = {
  path: {
    describe: 'The Okapi path or endpoint to operate on.',
    type: 'string',
  },
};

module.exports.pathOptions = pathOptions;

module.exports.pathRequired = {
  path: Object.assign({}, pathOptions.path, { required: true }),
};

module.exports.fileOptions = {
  json: {
    type: 'string',
    describe: 'File containing JSON data',
  },
};
