const copy = require('kopy');
const path = require('path');
const fs = require('fs');
const simpleGit = require('simple-git/promise');
const yarn = require('../yarn');
const { allModules, uiModules, stripesModules, platforms, toFolioName } = require('./inventory');


function validateModules(theModules) {
  let selectedModules;
  if (theModules.find(mod => mod === 'all')) {
    selectedModules = allModules;
  } else {
    selectedModules = theModules.filter(mod => allModules.includes(mod));
  }
  return selectedModules;
}

module.exports = class DevelopmentEnvironment {
  constructor(projectDir, selectedModules, isYarnWorkspace) {
    this.projectDir = projectDir;
    this.isYarnWorkspace = isYarnWorkspace;
    this.validModules = validateModules(selectedModules);
    this.platformDirs = this.validModules.filter(mod => platforms.includes(mod));
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

  cloneRepositories() {
    const git = simpleGit(this.projectDir);

    const clones = [];
    this.validModules.forEach((mod) => {
      const moduleRepo = `https://github.com/folio-org/${mod}.git`;
      clones.push(git.clone(moduleRepo));
    });
    // TODO: Improve output of parallel operation.
    return Promise.all(clones);
  }

  installDependencies() {
    if (this.isYarnWorkspace) {
      return yarn.install(this.projectDir);
    } else {
      const installs = [];
      this.validModules.forEach((mod) => {
        const moduleDir = path.join(this.projectDir, mod);
        installs.push(yarn.install(moduleDir));
      });
      // TODO: Improve output of parallel operation.
      return Promise.all(installs);
    }
  }

  // Creates an empty platform if one wasn't selected
  _initializePlatform() {
    return new Promise((resolve) => {
      if (!this.platformDirs.length) {
        this.platformDirs.push('dev-platform');
        copy(path.join(__dirname, '..', '..', 'resources', 'platform'), path.join(this.projectDir, 'dev-platform')).then(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // Creates stripes.config.js.local for each platform containing selected modules
  initializeStripesConfig() {
    const configModules = {};
    this.validModules.forEach((mod) => {
      configModules[toFolioName(mod)] = {};
    });

    // This regex pulls the "modules: { ... }" section out of stripes.config.js
    const modulesRegex = /modules:\s({[\s\S]*?[^{]}),/;
    let moduleString = '';

    // Construct replacement containing all selected modules with "@folio/" scope
    this.validModules.filter(mod => uiModules.includes(mod)).forEach((mod) => {
      moduleString += `    '${toFolioName(mod)}': {},\n`;
    });

    return new Promise((resolve) => {
      this._initializePlatform().then(() => {
        // Create stripes.config.js.local for each installed platform
        this.platformDirs.forEach((platformDir) => {
          const platformPath = path.join(this.projectDir, platformDir);
          let config = fs.readFileSync(path.join(platformPath, 'stripes.config.js'), 'utf-8');
          config = config.replace(modulesRegex, `modules: {\n${moduleString}  },`);
          fs.writeFileSync(path.join(platformPath, 'stripes.config.js.local'), config);
        });
        resolve();
      });
    });
  }

  initializeCliConfig() {
    const cliConfig = {
      configFile: 'stripes.config.js.local',
      aliases: {},
    };
    this.validModules.filter(mod => uiModules.includes(mod) || stripesModules.includes(mod)).forEach((mod) => {
      cliConfig.aliases[toFolioName(mod)] = path.join('..', mod);
    });

    this.platformDirs.forEach((platformDir) => {
      const cliFilePath = path.join(this.projectDir, platformDir, '.stripesclirc.json');
      fs.writeFileSync(cliFilePath, JSON.stringify(cliConfig, null, 2));
    });
    return Promise.resolve();
  }
};
