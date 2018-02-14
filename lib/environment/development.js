const copy = require('kopy');
const path = require('path');
const fs = require('fs');
const simpleGit = require('simple-git/promise');
const yarn = require('../yarn');
const { availableModules } = require('./inventory');


function validateModules(theModules) {
  let selectedModules;
  if (theModules.find(mod => mod === 'all')) {
    selectedModules = availableModules;
  } else {
    selectedModules = theModules.filter(mod => availableModules.includes(mod));
  }
  return selectedModules;
}

module.exports = class DevelopmentEnvironment {
  constructor(targetDir, isYarnWorkspace) {
    this.targetDir = targetDir;
    this.isYarnWorkspace = isYarnWorkspace;
  }

  createDirectory() {
    // TODO: Offer option to overwrite.
    if (fs.existsSync(this.targetDir)) {
      throw new Error(`Target directory "${this.targetDir}" already exists! Remove the directory first or use another name.`);
    }

    if (this.isYarnWorkspace) {
      // Copy the workspace template
      const templateDir = path.join(__dirname, '..', '..', 'resources', 'workspace');
      return copy(templateDir, this.targetDir, { clean: false });
    } else {
      // Otherwise just create an empty directory
      return new Promise((resolve, reject) => {
        fs.mkdir(this.targetDir, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  }

  cloneRepositories(selectedModules) {
    const validModules = validateModules(selectedModules);
    const git = simpleGit(this.targetDir);

    const clones = [];
    validModules.forEach((mod) => {
      const moduleRepo = `https://github.com/folio-org/${mod}.git`;
      clones.push(git.clone(moduleRepo));
    });
    // TODO: Improve output of parallel operation.
    return Promise.all(clones);
  }

  installDependencies(selectedModules) {
    console.log(selectedModules);
    const validModules = validateModules(selectedModules);

    if (this.isYarnWorkspace) {
      return yarn.install(this.targetDir);
    } else {
      const installs = [];
      validModules.forEach((mod) => {
        const moduleDir = path.join(this.targetDir, mod);
        installs.push(yarn.install(moduleDir));
      });
      // TODO: Improve output of parallel operation.
      return Promise.all(installs);
    }
  }
};
