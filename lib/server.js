const childProcess = require('child_process');
const path = require('path');
const fs = require('fs');

// Creates a child process to run http-server so we can get all the nice output
function runProcess(script, args) {
  const options = {
    cwd: path.resolve(),
    stdio: 'inherit',
  };

  return new Promise((resolve, reject) => {
    childProcess.spawn(script, args, options)
      .on('exit', (error) => {
        if (error) {
          reject(error);
        }
        resolve();
      });
  });
}

function start(dir, options) {
  // Perform some basic checks to ensure we have a directory with something to serve
  if (!fs.existsSync(path.resolve(dir))) {
    console.log(`Directory "${dir}" does not exist.`);
    return;
  }
  if (!fs.existsSync(path.resolve(dir, 'index.html'))) {
    console.log(`Directory "${dir}" does not contain an index.html.`);
    return;
  }

  const httpServer = path.join(__dirname, '..', 'node_modules', '.bin', 'http-server');
  const serverArgs = [
    dir,
    '--port', options.port,
    '--host', options.host,
  ];

  runProcess(httpServer, serverArgs);
}

module.exports = {
  start,
};
