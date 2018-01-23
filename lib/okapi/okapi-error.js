module.exports = class OkapiError extends Error {
  constructor(response, message, ...args) {
    super(message, ...args);
    this.name = this.constructor.name;
    this.requestUrl = response.url;
    this.statusCode = response.status;
    this.statusText = response.statusText;
    Error.captureStackTrace(this, OkapiError);
  }
};
