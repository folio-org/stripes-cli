const path = require('path');
const { uniq } = require('lodash');
const fs = require('fs');

const StripesPlatform = require('../platform/stripes-platform');
const StripesCore = require('../cli/stripes-core');
const generateModuleDescriptor = require('../cli/generate-module-descriptor');
const { moduleDescriptorExtras, backendDescriptorExtras, toFolioName } = require('../environment/inventory');

module.exports = class DescriptorService {
  constructor(context, stripesConfig) {
    this.context = context;
    this.stripesConfig = stripesConfig;
  }

  _loadPlatform() {
    if (!this.platform) {
      // Initialize a platform to take aliases, if any, into account
      this.platform = new StripesPlatform(this.stripesConfig, this.context);
      this.stripesCore = new StripesCore(this.context, this.platform.aliases);
    }
  }

  getUiPlatformModuleDescriptors(isStrict) {
    this._loadPlatform();
    const packageJsons = [];
    const stripesConfig = this.platform.getStripesConfig();
    const moduleNames = Object.getOwnPropertyNames(stripesConfig.modules);
    const extraModuleNames = moduleDescriptorExtras.map(mod => toFolioName(mod));

    uniq(moduleNames.concat(extraModuleNames)).forEach(moduleName => {
      // The StripesModuleParser's constructor takes care of locating a module's package.json
      try {
        const moduleParser = new this.stripesCore.api.StripesModuleParser(moduleName, {}, this.context.cwd, this.platform.aliases);
        packageJsons.push(moduleParser.packageJson);
      } catch (err) {
        if (err instanceof this.stripesCore.api.StripesBuildError && extraModuleNames.includes(moduleName)) {
          // Quietly ignore if the platform doesn't actually have these extra modules
        } else {
          throw (err);
        }
      }
    });

    const descriptors = packageJsons.map(packageJson => generateModuleDescriptor(packageJson, isStrict));
    return descriptors;
  }

  getUiModuleDescriptor(isStrict) {
    const packageJsonPath = path.join(this.context.cwd, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`Unable to locate ui-module package.json: ${packageJsonPath}`);
    }
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
    const descriptor = generateModuleDescriptor(packageJson, isStrict);
    return [descriptor];
  }

  getBackendModuleDescriptor() {
    const descriptorPath = path.join(this.context.cwd, 'target', 'ModuleDescriptor.json');
    if (!fs.existsSync(descriptorPath)) {
      throw new Error(`Unable to locate backend descriptor: ${descriptorPath}`);
    }
    const descriptor = JSON.parse(fs.readFileSync(descriptorPath));
    return [descriptor];
  }

  getModuleDescriptorsFromContext(isStrict) {
    if (this.context.isPlatform) {
      return this.getUiPlatformModuleDescriptors(isStrict);
    } else if (this.context.isBackendModule) {
      return this.getBackendModuleDescriptor();
    }
    return this.getUiModuleDescriptor(isStrict);
  }

  static extendModuleDescriptorIds(moduleDescriptorIds, manuallyAdded) {
    const automaticallyAdded = backendDescriptorExtras.reduce((accumulator, current) => {
      let found = [];
      // If we have all the matching prerequisites, more module ids are included
      if (current.match && current.match.every(name => moduleDescriptorIds.find(id => id.startsWith(name)))) {
        found = current.ids;
      }
      return accumulator.concat(found);
    }, []);

    // Remove duplicates
    const idsToAdd = uniq(automaticallyAdded.concat(manuallyAdded || []));
    return moduleDescriptorIds.concat(idsToAdd);
  }

  static writeModuleDescriptorsToDirectory(descriptors, outdir) {
    if (!fs.existsSync(outdir)) {
      fs.mkdirSync(outdir);
    }

    // Write descriptors to individual files
    descriptors.forEach(descriptor => {
      // Regex to find a name like "plugin-find-user" inside of an id like "folio_plugin-find-user-1.4.100038"
      const nameMatch = descriptor.id.match(/folio_(.*)-/);
      const filename = nameMatch ? nameMatch[1] : descriptor.id;
      const formattedJson = JSON.stringify(descriptor, null, 2);
      fs.writeFileSync(`${outdir}/${filename}.json`, `${formattedJson}\n`, { encoding: 'utf8' });
    });
  }
};
