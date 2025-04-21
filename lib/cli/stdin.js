import wrappedGetStdin from 'get-stdin';

function getStdin() {
  // Per Node docs, the preferred method of determining whether Node.js is being run within
  // a TTY context is to check that the value of the process.stdout.isTTY property is true
  // (https://nodejs.org/docs/latest-v8.x/api/tty.html)
  if (process.stdout.isTTY) {
    return wrappedGetStdin();
  } else {
    return Promise.resolve();
  }
}

export default {
  getStdin
};
