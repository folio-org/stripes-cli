import lodashMod from 'lodash';

const { merge } = lodashMod;

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
    languages: ['en'],
    useSecureTokens: true,

    // run tests in production-mode
    // <StrictMode> is intended for dev-only
    disableStrictMode: true,
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
function mergeConfig(base, extend) {
  return merge({}, base, extend);
}

export default {
  defaultConfig,
  emptyConfig,
  mergeConfig,
};
