const OkapiClient = require('./okapi-client');

const parseJson = data => data.json();
const stringifyJson = data => JSON.stringify(data, null, '  ');

module.exports = class EndpointService {
  constructor(okapi, tenant) {
    this.client = new OkapiClient(okapi, tenant);
  }

  get(path) {
    return this.client
      .get(path)
      .then(parseJson)
      .then(stringifyJson);
  }

  post(path, body) {
    return this.client
      .post(path, body)
      .then(parseJson)
      .then(stringifyJson);
  }

  put(path, body) {
    return this.client
      .put(path, body)
      .then(parseJson)
      .then(stringifyJson);
  }

  delete(path) {
    return this.client
      .delete(path)
      .then(response => response.status >= 200 && response.status < 300);
  }
};
