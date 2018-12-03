const fs = require('fs');
const { resolveIfOkapiSays } = require('../okapi/okapi-utils');
const ModuleService = require('./module-service');

module.exports = class PermissionService {
  constructor(okapiRepository, context) {
    this.okapi = okapiRepository;
    this.context = context;

    // TODO: Inject or move
    this.moduleService = new ModuleService(this.okapi);
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
        return resolve(false);
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

  assignPermissionToUserId(permissionName, userId) {
    return this.okapi.perms.assignPermissionToUser(permissionName, userId)
      .then(() => ({ id: permissionName, success: true }))
      .catch(resolveIfOkapiSays('already has permission', { id: permissionName, alreadyExists: true }));
  }

  assignPermissionToUser(permissionName, username) {
    // TODO: Validate permission exists
    return this.okapi.users.getUserByUsername(username)
      .then(response => response.json())
      .then(payload => this.assignPermissionToUserId(permissionName, payload.users[0].id));
  }

  assignPermissionsToUser(permissionNames, username) {
    return this.okapi.users.getUserByUsername(username)
      .then(response => response.json())
      .then(payload => {
        return permissionNames.map(permissionName => (previousResults) => {
          const results = previousResults || [];
          return this.assignPermissionToUserId(permissionName, payload.users[0].id).then(result => {
            results.push(result);
            return results;
          });
        })
          .reduce((promiseChain, currentFunction) => promiseChain.then(currentFunction), Promise.resolve([]));
      });
  }

  listPermissionsForUser(username) {
    return this.okapi.users.getUserByUsername(username)
      .then(response => response.json())
      .then(payload => this.okapi.perms.getUserPermissions(payload.users[0].id))
      .then(response => response.json())
      .then(data => data.permissionNames);
  }

  unassignPermissionFromUserId(permissionName, userId) {
    return this.okapi.perms.unassignPermissionFromUser(permissionName, userId)
      .then(() => ({ id: permissionName, success: true }))
      .catch(resolveIfOkapiSays('does not contain', { id: permissionName, alreadySatisfied: true }));
  }

  unassignPermissionsFromUser(permissionNames, username) {
    return this.okapi.users.getUserByUsername(username)
      .then(response => response.json())
      .then(payload => {
        return permissionNames.map(permissionName => (previousResults) => {
          const results = previousResults || [];
          return this.unassignPermissionFromUserId(permissionName, payload.users[0].id).then(result => {
            results.push(result);
            return results;
          });
        })
          .reduce((promiseChain, currentFunction) => promiseChain.then(currentFunction), Promise.resolve([]));
      });
  }

  // Gather all permissions for this tenant's modules and assign them to a user
  async assignAllTenantPermissionsToUser(tenant, username) {
    const userPermissions = await this.listPermissionsForUser(username);
    const tenantModuleIds = await this.moduleService.listModulesForTenant(tenant);
    const modulePermissions = await this.moduleService.listModulePermissions(tenantModuleIds, false);
    const permissionsToAssign = modulePermissions.filter(perm => !userPermissions.includes(perm));
    const assignmentResponses = await this.assignPermissionsToUser(permissionsToAssign, username);

    return assignmentResponses.filter(response => !response.alreadyExists).map(response => response.id);
  }
};
