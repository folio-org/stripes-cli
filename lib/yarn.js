const childProcess = require('child_process');

function runYarn(options) {
  return new Promise((resolve, reject) => {
    const installProcess = childProcess.exec('yarn', options, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ isInstalled: true, appDir: options.cwd });
    });
    installProcess.stdout.on('data', data => console.log(data));
  });
}

function install(projectDir) {
  console.log(`Installing dependencies for "${projectDir}" ...`);
  return runYarn({ cwd: projectDir })
    .catch((err) => {
      console.error('Something went wrong while attempting to use Yarn.');
      console.info(err);
    });
}

module.exports = {
  install,
};
