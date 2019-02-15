const getStdin = require('get-stdin');

function stdinWrapper() {
  // Per Node docs, the preferred method of determining whether Node.js is being run within
  // a TTY context is to check that the value of the process.stdout.isTTY property is true
  // (https://nodejs.org/docs/latest-v8.x/api/tty.html)
  if (process.stdout.isTTY) {
    return getStdin();
  } else {
    return Promise.resolve();
  }
}

// Wrapper to facilitate testing
module.exports = {
  getStdin: stdinWrapper,
};
