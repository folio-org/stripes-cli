const copy = require('kopy');
const path = require('path');
const fs = require('fs');
const simpleGit = require('simple-git/promise');
const semver = require('semver');
const context = require('../cli/context');
const yarn = require('../yarn');
const { allModules, allModulesAsFlatArray, toFolioName } = require('./inventory');
const AliasService = require('../platform/alias-service');
const logger = require('../cli/logger')();
const { version: currentCLIVersion } = require('../../package.json');

// Compare a list of module names against those known to be valid
function validateModules(theModules) {
  const selectedModules = theModules.filter(mod => allModulesAsFlatArray().includes(mod));
  return selectedModules;
}

function mergeUnique(...theArrays) {
  const temp = {};
  theArrays.forEach((arr) => {
    arr.forEach((val) => {
      temp[val] = val;
    });
  });
  return Object.values(temp);
}

// Contains logic to create and manage a development environment
// Includes shared module/alias validation for consistency across operations.
module.exports = class DevelopmentEnvironment {
  constructor(projectDir, isYarnWorkspace) {
    this.projectDir = projectDir;
    this.isYarnWorkspace = isYarnWorkspace;
    this.validModules = [];
  }

  // Initializes a new environment by selecting and validating modules.
  // This may get re-used for adding modules to an existing environment (future)
  selectNewModules(selectedModules) {
    this.validModules = validateModules(selectedModules);
    this.platformDirs = this.validModules.filter(mod => platforms.includes(mod));
  }

  // Initializes an existing environment by seeing what modules already exist
  loadExistingModules() {
    logger.log('identifying existing modules...');
    this.isExisting = true;
    // Level-set for workspace behavior if the parent is a workspace
    if (!this.isYarnWorkspace && this._parentIsWorkspace()) {
      // this.currentPlatform = path.parse(this.projectDir).name;
      this.projectDir = path.join(this.projectDir, '..');
      this.isYarnWorkspace = true;
    }

    // Workspace only: Start with the current directory to locate modules
    if (this.isYarnWorkspace) {
      const contents = fs.readdirSync(this.projectDir);
      this.validModules = validateModules(contents);
    }

    // Platform and workspace: Use the alias configuration to locate modules
    const aliasService = new AliasService();
    this.aliases = aliasService.getValidatedAliases();
    const aliasModules = Object.values(this.aliases)
      .filter(alias => this._isOutsideWorkspace(alias.path))
      .map(alias => path.parse(alias.path).name);
    this.validModules = mergeUnique(this.validModules, aliasModules);
    logger.log('modules found', this.validModules);
  }

  // Returns absolute file paths for all active module directories
  getModulePaths() {
    const moduleDirs = this.validModules.map((mod) => {
      const folioMod = toFolioName(mod);
      if (this.aliases && this.aliases[folioMod]) {
        return this.aliases[folioMod].path;
      } else {
        return path.join(this.projectDir, mod);
      }
    });
    // We may be already in the platform dir, so make sure to include it.
    // This is not an issue for new environments, since the platform is one of the selected items
    if (this.isExisting && !moduleDirs.includes(this.projectDir)) {
      moduleDirs.push(this.projectDir);
    }
    return moduleDirs;
  }

  // Peek up a directory and check its context to see if we're inside a workspace.
  _parentIsWorkspace() {
    const parentContext = context.getContext(path.join(this.projectDir, '..'));
    return parentContext.isWorkspace;
  }

  // Check if a module path exists outside the workspace.
  _isOutsideWorkspace(moduleDir) {
    return path.relative(this.projectDir, moduleDir).startsWith('..');
  }

  // Create a directory for the development environment
  createDirectory(cliConfigDefaults) {
    if (fs.existsSync(this.projectDir)) {
      throw new Error(`Target directory "${this.projectDir}" already exists! Remove the directory first or use another name.`);
    }
    if (!this.isYarnWorkspace) {
      throw new Error('createDirectory() is not supported in this context');
    }

    // Copy the workspace template
    const templateDir = path.join(__dirname, '..', '..', 'resources', 'workspace');
    const { version: normalizedCLIVersion } = semver.coerce(currentCLIVersion);
    const zeroPatchCLIVersion = normalizedCLIVersion.replace(/\d*$/, '0');

    cliConfigDefaults.cliVersion = zeroPatchCLIVersion;

    return copy(templateDir, this.projectDir, { data: cliConfigDefaults, clean: false });
  }

  // Clones all repositories
  cloneRepositories() {
    const git = simpleGit(this.projectDir);
    const clones = [];
    this.validModules.forEach((mod) => {
      const moduleRepo = `https://github.com/folio-org/${mod}.git`;
      clones.push(git.clone(moduleRepo));
    });
    return Promise.all(clones);
  }

  // Installs all dependencies
  installDependencies() {
    let installs;
    if (this.isYarnWorkspace) {
      // When in a workspace, one install is typically sufficient
      installs = yarn.install(this.projectDir);
      // Check for any modules referenced outside of the workspace. Those will need to be installed separately.
      this.getModulePaths()
        .filter(moduleDir => this._isOutsideWorkspace(moduleDir))
        .forEach((moduleDir) => {
          installs = installs.then(() => yarn.install(moduleDir));
        });
    } else {
      // For a platform without workspace, we need to install each cloned module separately
      this.getModulePaths().forEach((moduleDir) => {
        installs = installs ? installs.then(() => yarn.install(moduleDir)) : yarn.install(moduleDir);
      });
    }
    return installs;
  }

  // Creates "stripes.config.js.local" containing selected modules for each platform
  initializeStripesConfig() {
    const mods = allModules();
    return new Promise((resolve) => {
      // Create stripes.config.js.local for each installed platform
      this.platformDirs.forEach((platformDir) => {
        const platformPath = path.join(this.projectDir, platformDir);
        const existingConfigFile = path.join(platformPath, 'stripes.config.js');
        const localConfigFile = path.join(platformPath, 'stripes.config.js.local');

        // Check that existing config contains all selected UI modules
        const existingConfig = require(existingConfigFile); // eslint-disable-line
        const existingMods = Object.keys(existingConfig.modules);
        const uiMods = this.validModules.filter(mod => mods.apps.includes(mod));
        const missingModules = uiMods.filter(mod => !existingMods.includes(mod));

        // Add any modules that are missing and write the new file
        if (missingModules.length) {
          const modulesRegex = /modules:.*/;
          let moduleString = '';
          missingModules.forEach((mod) => {
            moduleString += `\n    '${toFolioName(mod)}': {},`;
          });
          let config = fs.readFileSync(existingConfigFile, 'utf-8');
          config = config.replace(modulesRegex, `modules: {${moduleString}`);
          fs.writeFileSync(localConfigFile, config);
        } else {
          // Otherwise, just copy the original
          fs.copyFileSync(existingConfigFile, localConfigFile);
        }
      });
      resolve();
    });
  }
};
