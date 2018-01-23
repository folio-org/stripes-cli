module.exports = class AliasError extends Error {
  constructor(...args) {
    super(...args);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, AliasError);
  }
};
