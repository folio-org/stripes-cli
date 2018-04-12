const debug = require('debug');

// Wrapper for debug to ensure consistent use of namespace
module.exports = function getLogger(name) {
  const namespace = name ? `stripes-cli:${name}` : 'stripes-cli';
  const logger = debug(namespace);

  return {
    log: (...args) => logger(...args),
  };
};
