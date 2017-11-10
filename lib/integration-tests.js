const childProcess = require('child_process');
const path = require('path');

function runIntegrationTests(args) {
  const mocha = path.join(__dirname, '../node_modules/.bin/mocha');
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

module.exports = function integrationTests(appName, testName) {

  // TODO: prepare the arguments for ui-testing
  const testArgs = [];

  return runIntegrationTests(testArgs)
    .catch((err) => {
      console.error('Something went wrong while attempting to run the integration tests.');
      console.info(err);
    });
};
