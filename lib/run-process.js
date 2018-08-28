const childProcess = require('child_process');
const path = require('path');
const logger = require('./cli/logger')();

// Wraps a child process in a promise
module.exports = function runProcess(script, args, options) {
  const defaults = {
    cwd: path.resolve(),
    stdio: 'inherit',
  };

  if (process.platform === 'win32') {
    defaults.shell = true;
  }

  return new Promise((resolve, reject) => {
    logger.log('spawn child process', script);
    logger.log('child process args', args);
    childProcess.spawn(script, args, Object.assign({}, defaults, options))
      .on('exit', (error) => {
        logger.log('child process exited');
        if (error) {
          reject(error);
        }
        resolve();
      })
      .on('error', (error) => {
        logger.log('child process failed');
        reject(error);
      });
  });
};
