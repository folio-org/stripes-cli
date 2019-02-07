module.exports = class StripesCliError extends Error {
  constructor(...args) {
    super(...args);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, StripesCliError);
  }
};
