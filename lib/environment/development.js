const copy = require('kopy');
const path = require('path');
const fs = require('fs');
const simpleGit = require('simple-git/promise');
const yarn = require('../yarn');
const { availableModules, uiModules } = require('./inventory');


function validateModules(theModules) {
  let selectedModules;
  if (theModules.find(mod => mod === 'all')) {
    selectedModules = availableModules;
  } else {
    selectedModules = theModules.filter(mod => availableModules.includes(mod));
  }
  return selectedModules;
}

function folioName(theModule) {
  let moduleName = theModule;
  if (uiModules.includes(theModule)) {
    moduleName = moduleName.replace(/^ui-/, '');
  }
  return `@folio/${moduleName}`;
}

module.exports = class DevelopmentEnvironment {
  constructor(projectDir, isYarnWorkspace) {
    this.projectDir = projectDir;
    this.isYarnWorkspace = isYarnWorkspace;
  }

  createDirectory() {
    // TODO: Offer option to overwrite.
    if (fs.existsSync(this.projectDir)) {
      throw new Error(`Target directory "${this.projectDir}" already exists! Remove the directory first or use another name.`);
    }

    if (this.isYarnWorkspace) {
      // Copy the workspace template
      const templateDir = path.join(__dirname, '..', '..', 'resources', 'workspace');
      return copy(templateDir, this.projectDir, { clean: false });
    } else {
      // Otherwise just create an empty directory
      return new Promise((resolve, reject) => {
        fs.mkdir(this.projectDir, (err) => {
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
    const git = simpleGit(this.projectDir);

    const clones = [];
    validModules.forEach((mod) => {
      const moduleRepo = `https://github.com/folio-org/${mod}.git`;
      clones.push(git.clone(moduleRepo));
    });
    // TODO: Improve output of parallel operation.
    return Promise.all(clones);
  }

  installDependencies(selectedModules) {
    const validModules = validateModules(selectedModules);

    if (this.isYarnWorkspace) {
      return yarn.install(this.projectDir);
    } else {
      const installs = [];
      validModules.forEach((mod) => {
        const moduleDir = path.join(this.projectDir, mod);
        installs.push(yarn.install(moduleDir));
      });
      // TODO: Improve output of parallel operation.
      return Promise.all(installs);
    }
  }

  initializeConfigs(selectedModules) {
    // TODO: Define .stripesclirc for non-workspace env
    if (!this.isYarnWorkspace) {
      return Promise.resolve();
    }

    const validModules = validateModules(selectedModules);
    const cliFilePath = path.join(this.projectDir, '.stripesclirc');
    const cliConfig = {
      aliases: {},
    };

    validModules.forEach((mod) => {
      cliConfig.aliases[folioName(mod)] = path.join('.', mod);
    });

    return new Promise((resolve, reject) => {
      const content = JSON.stringify(cliConfig, null, 2);
      fs.writeFile(cliFilePath, content, null, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
};
