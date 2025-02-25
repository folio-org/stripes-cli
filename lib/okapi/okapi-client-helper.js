import OkapiError from './okapi-error.js';
import getLogger from '../cli/logger.js';

const logger = getLogger('okapi');

// Ensures the operation return with a 2xx status code
export function ensureOk(response) {
  logger.log(`<--- ${response.status} ${response.statusText}`);
  if (response.ok) {
    return response;
  }
  return response.text().then((message) => {
    throw new OkapiError(response, message);
  });
}

export function optionsHeaders(options) {
  return Object.entries(options.headers || {}).map(([k, v]) => `-H '${k}: ${v}'`).join(' ');
}

export function optionsBody(options) {
  return options.body ? `-d ${JSON.stringify(options.body)}` : '';
}

// Wraps fetch to capture request/response for logging
export function okapiFetch(resource, options) {
  logger.log(`---> curl -X${options.method} ${optionsHeaders(options)} ${resource} ${optionsBody(options)}`);
  return fetch(resource, options).then(ensureOk);
}
