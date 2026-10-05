import OkapiError from './okapi-error.js';

// Helper for services to easily resolve acceptable Okapi responses
function resolveIfOkapiSays(acceptableText, responseObj) {
  return (error) => {
    if (error instanceof OkapiError && error.message.includes(acceptableText)) {
      return Promise.resolve(responseObj || error);
    } else {
      throw error;
    }
  };
}

export default { resolveIfOkapiSays };
