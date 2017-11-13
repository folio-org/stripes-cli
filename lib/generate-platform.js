// Generates a FOLIO platform with a stripes tenant configuration
// suitable for serving up an app module within its own directory

const template = {
  okapi: {
    url: 'http://localhost:9130',
    tenant: 'diku',
  },
  config: {
    logCategories: 'core,path,action,xhr',
    logPrefix: '--',
    showPerms: false,
    hasAllPerms: false,
  },
  modules: {
  },
};

module.exports = function generatePlatform(moduleName, options) {
  const modules = {};
  modules[moduleName] = {};
  const config = Object.assign({}, template, { modules });

  if (options) {
    if (options.okapi) {
      config.okapi.url = options.okapi;
    }
    if (options.tenant) {
      config.okapi.tenant = options.tenant;
    }
    if (options.hasAllPerms) {
      config.config.hasAllPerms = true;
    }
  }

  return config;
};
