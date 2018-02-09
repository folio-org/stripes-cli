const childProcess = require('child_process');
const path = require('path');

// Creates a child process to run Mocha
function runMocha(args) {
  const mocha = path.join(__dirname, '../../node_modules/.bin/mocha');
  const cliTestModule = path.join(__dirname, 'cli-test-module.js');
  const cliArgs = [cliTestModule, '--exit'].concat(args);

  const options = {
    cwd: path.resolve(),
    stdio: 'inherit',
  };

  return new Promise((resolve, reject) => {
    childProcess.spawn(mocha, cliArgs, options)
      .on('exit', (error) => {
        if (error) {
          reject(error);
        }
        resolve();
      });
  });
}

// Runs the specified integration tests
// Recreates a subset of the options found ui-testing
// However, '--run' only accepts a test name, rather than both the app and test name.
module.exports = function runNightmareTests(options) {
  const testArgs = [
    '--run', options.run || 'test',
    '--url', `http://${options.host || 'localhost'}:${options.port || '3000'}`,
  ];

  if (options.show) {
    testArgs.push('--show');
  }

  return runMocha(testArgs)
    .catch((err) => {
      console.error('Some tests failed or something went wrong while attempting to run the tests.');
      console.info(err);
      process.exit(1);
    });
};
