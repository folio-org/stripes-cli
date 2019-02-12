module.exports = {
  okapi: {
    url: 'http://localhost:9130',
    tenant: 'diku',
  },
  config: {
    something: 'from test config file',
  },
  modules: {
    '@folio/trivial': {},
    '@folio/users': {},
  },
};
