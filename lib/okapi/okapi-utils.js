import OkapiError from './okapi-error.js';

// Helper for services to easily resolve acceptable Okapi responses
export const resolveIfOkapiSays = function resolveIfOkapiSays(acceptableText, responseObj) {
  return (error) => {
    if (error instanceof OkapiError && error.message.includes(acceptableText)) {
      return Promise.resolve(responseObj || error);
    } else {
      throw error;
    }
  };
};
