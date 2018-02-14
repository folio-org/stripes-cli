const fs = require('fs');
const { resolveIfOkapiSays } = require('../okapi/okapi-utils');

module.exports = class PermissionService {
  constructor(okapiRepository, context) {
    this.okapi = okapiRepository;
    this.context = context;
  }

  _loadPackageJson() {
    let packageJson;
    try {
      packageJson = require(`${this.context.cwd}/package.json`); // eslint-disable-line
    } catch (e) {
      return false;
    }
    return packageJson;
  }

  // Add permissions to the package file (initial permission is done via template)
  addPermissionToPackage(permission) {
    return new Promise((resolve, reject) => {
      const packageJson = this._loadPackageJson();
      if (!packageJson) {
        reject(new Error(`No package.json found in ${this.context.cwd}`)); // TODO: Define CLI errors...
      }
      // Add new permission to "permissionSets" if not already there
      const found = packageJson.stripes.permissionSets.findIndex(perm => perm.permissionName === permission.permissionName);
      if (found > -1) {
        resolve(false);
      } else {
        packageJson.stripes.permissionSets.push(permission);
      }
      fs.writeFile(`${this.context.cwd}/package.json`, JSON.stringify(packageJson, null, 2), (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(packageJson);
        }
      });
    });
  }

  assignPermissionToUser(permissionName, username) {
    // TODO: Validate permission exists
    return this.okapi.users.getUserByUsername(username)
      .then(response => response.json())
      .then(payload => this.okapi.perms.assignPermissionToUser(permissionName, payload.users[0].id))
      .then(() => ({ id: permissionName, success: true }))
      .catch(resolveIfOkapiSays('already has permission', { id: permissionName, alreadyExists: true }));
  }
};
