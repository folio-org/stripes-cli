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
    installProcess.stdout.on('data', data => console.log(`  ${data.trim()}`));
  });
}

function yarnAdd(packageName, isDevDep, options) {
  const pkgs = [].concat(packageName).join(' ');
  const flag = isDevDep ? '--dev' : '';

  return new Promise((resolve, reject) => {
    const installProcess = childProcess.exec(`yarn add ${flag} ${pkgs}`, options, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ isInstalled: true, appDir: options.cwd });
    });
    installProcess.stdout.on('data', data => console.log(`  ${data.trim()}`));
  });
}

// Above method does not capture full yarn output, but is a lot quieter
// TODO: Offer option to toggle between the two

// function runYarn(options) {
//   options.stdio = 'inherit';
//   return new Promise((resolve, reject) => {
//     childProcess.spawn('yarn', [], options)
//       .on('exit', (error) => {
//         if (error) {
//           reject(error);
//         }
//         resolve({ isInstalled: true, appDir: options.cwd });
//       });
//   });
// }

function install(projectDir) {
  console.log(` Directory "${projectDir}"`);
  return runYarn({ cwd: projectDir })
    .catch((err) => {
      console.error('Something went wrong while attempting to use Yarn.');
      console.info(err);
    });
}

function add(projectDir, packageName, isDev) {
  console.log(` Directory "${projectDir}"`);
  return yarnAdd(packageName, isDev, { cwd: projectDir })
    .catch((err) => {
      console.error('Something went wrong while attempting to use Yarn.');
      console.info(err);
    });
}

module.exports = {
  add,
  install,
};
