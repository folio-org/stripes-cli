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
  aliases: {
  },
};

// Merge two stripes configurations
// Replace with deep merge?
function mergeConfig(base, extend) {
  return {
    okapi: Object.assign({}, base.okapi, extend.okapi),
    config: Object.assign({}, base.config, extend.config),
    modules: Object.assign({}, base.modules, extend.modules),
    aliases: Object.assign({}, base.aliases, extend.aliases),
  };
}

module.exports = {
  defaultConfig,
  mergeConfig,
};
