const packageManager = require('./package-manager');

function install(projectDir) {
  console.log(` Directory "${projectDir}"`);
  return packageManager.install(projectDir)
    .catch((err) => {
      console.error('Something went wrong while attempting to use Yarn.');
      console.info(err);
    });
}

function add(projectDir, packageName, isDev) {
  console.log(` Directory "${projectDir}"`);
  return packageManager.add(projectDir, packageName, isDev)
    .catch((err) => {
      console.error('Something went wrong while attempting to add package via package manager.');
      console.info(err);
    });
}

module.exports = {
  add,
  install,
};
