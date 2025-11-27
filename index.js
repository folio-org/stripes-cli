const { babelOptions } = require('@folio/stripes-webpack');
const { getBaseCypressConfig } = require('./lib/test/cypress-service');

module.exports = {
  babelOptions,
  getBaseCypressConfig
};

