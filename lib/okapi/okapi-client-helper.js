const fetch = require('minipass-fetch');
const OkapiError = require('./okapi-error');

const logger = require('../cli/logger')('okapi');


// Ensures the operation return with a 2xx status code
function ensureOk(response) {
  logger.log(`<--- ${response.status} ${response.statusText}`);
  if (response.ok) {
    return response;
  }
  return response.text().then((message) => {
    throw new OkapiError(response, message);
  });
}

function optionsHeaders(options) {
  return Object.entries(options.headers || {}).map(([k, v]) => `-H '${k}: ${v}'`).join(' ');
}

function optionsBody(options) {
  return options.body ? `-d ${JSON.stringify(options.body)}` : '';
}

// Wraps fetch to capture request/response for logging
function okapiFetch(resource, options) {
  logger.log(`---> curl -X${options.method} ${optionsHeaders(options)} ${resource} ${optionsBody(options)}`);
  return fetch(resource, options).then(ensureOk);
}

module.exports = {
  ensureOk,
  optionsHeaders,
  optionsBody,
  okapiFetch,
};
