const defaultConfig = {
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
  branding: {
  },
};

const emptyConfig = {
  okapi: {},
  config: {},
  modules: {},
  branding: {},
};

// Merge two stripes configurations
// Replace with deep merge?
function mergeConfig(base, extend) {
  return {
    okapi: Object.assign({}, base.okapi, extend.okapi),
    config: Object.assign({}, base.config, extend.config),
    modules: Object.assign({}, base.modules, extend.modules),
    branding: Object.assign({}, base.branding, extend.branding),
  };
}

module.exports = {
  defaultConfig,
  emptyConfig,
  mergeConfig,
};
