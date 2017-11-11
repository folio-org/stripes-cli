const childProcess = require('child_process');
const path = require('path');

function runMocha(args) {
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

module.exports = function integrationTests(options) {
  const testArgs = [
    '--run', options.run || 'test',
    '--url', `http://${options.host || 'localhost'}:${options.port || '3000'}`,
  ];

  if (options.devTools) {
    testArgs.push('--devTools');
  }

  return runMocha(testArgs)
    .catch((err) => {
      console.error('Some tests failed or something went wrong while attempting to run the tests.');
      console.info(err);
    });
};

//  ./node_modules/.bin/mocha test-module.js "-o" "--devTools" "--h=localhost" "--run=users:new_user"
// /Users/employee/projects/folio/stripes-cli/node_modules/.bin/mocha /Users/employee/projects/folio/stripes-cli/lib/test-framework/cli-test-module.js --exit
