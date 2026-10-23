import debug from 'debug';

// Wrapper for debug to ensure consistent use of namespace
export default function getLogger(name) {
  const namespace = name ? `stripes-cli:${name}` : 'stripes-cli';
  const logger = debug(namespace);

  return {
    log: (...args) => logger(...args),
  };
}
