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
};

const emptyConfig = {
  okapi: {},
  config: {},
  modules: {},
};

// Merge two stripes configurations
// Replace with deep merge?
function mergeConfig(base, extend) {
  return {
    okapi: Object.assign({}, base.okapi, extend.okapi),
    config: Object.assign({}, base.config, extend.config),
    modules: Object.assign({}, base.modules, extend.modules),
  };
}

module.exports = {
  defaultConfig,
  emptyConfig,
  mergeConfig,
};
