const childProcess = require('child_process');
const path = require('path');
const logger = require('../cli/logger')('ui-testing');

// Creates a child process to run Mocha
function runMocha(args) {
  const mocha = path.join(__dirname, '../../node_modules/.bin/mocha');
  const uiTestModule = require.resolve('@folio/ui-testing/test-module.js');
  logger.log('ui-testing path', uiTestModule);
  const cliArgs = [uiTestModule].concat(args);

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

// Runs the specified nightmare tests with @folio/ui-testing
module.exports = function runNightmareTests(options) {
  const cwd = path.resolve();

  const testArgs = [
    '--workingDirectory', cwd,
    '--url', `http://${options.host || 'localhost'}:${options.port || '3000'}`,
    '--run', options.run ? `WD:${options.run}` : 'WD', // Here 'WD' instructs ui-testing to run tests against the working directory
  ];

  if (options.show) {
    testArgs.push('--show');
    testArgs.push('--devTools');
  }

  // Apply args for ui-testing
  if (options.uiTest && typeof options.uiTest === 'object') {
    Object.keys(options.uiTest).forEach((key) => {
      testArgs.push(`--${key}`);
      if (options.uiTest[key]) {
        testArgs.push(options.uiTest[key]);
      }
    });
  }
  logger.log('test args', testArgs);

  return runMocha(testArgs);
};
