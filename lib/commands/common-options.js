export const serverOptions = {
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
  proxyHost: {
    type: 'string',
    describe: 'Proxy scheme and host',
    default: 'http://localhost',
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

export const authOptions = {
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

export { okapiOptions };

export const okapiOption = {
  okapi: okapiOptions.okapi,
};

export const tenantOption = {
  tenant: okapiOptions.tenant,
};

export const okapiRequired = {
  okapi: Object.assign({}, okapiOptions.okapi, { required: true }),
};

export const tenantRequired = {
  tenant: Object.assign({}, okapiOptions.tenant, { required: true }),
};

export const moduleIdsStdin = {
  ids: {
    describe: 'Module descriptor ids (stdin)',
    type: 'array',
  }
};

// When applied as a positional, "configFile" is the first parameter:
//    yargs.positional('configFile', stripesConfigFile.configFile)
export const stripesConfigFile = {
  configFile: {
    type: 'string',
    describe: 'File containing a Stripes tenant configuration',
    applyAsPositional: true,
    conflicts: 'stripesConfig'
  },
};

export const stripesConfigStdin = {
  stripesConfig: {
    type: 'string',
    describe: 'Stripes config JSON (stdin)',
    conflicts: 'configFile',
  },
};

export const stripesConfigOptions = {
  hasAllPerms: {
    type: 'boolean',
    describe: 'Set "hasAllPerms" in Stripes config',
  },
  languages: {
    type: 'array',
    describe: 'Languages to include in tenant build',
  }
};

export const buildOptions = {
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

export { pathOptions };

export const pathRequired = {
  path: Object.assign({}, pathOptions.path, { required: true }),
};

export const fileOptions = {
  json: {
    type: 'string',
    describe: 'File containing JSON data',
  },
};
