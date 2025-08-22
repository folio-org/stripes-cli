import path from 'path';
import { contextMiddleware } from '../../cli/context-middleware.js';

function appPermsCommand(argv) {
  const context = argv.context;
  if (!context.isUiModule) {
    console.log('"app perms" only works in the APP context');
    return;
  }

  const packageJson = require(path.join(context.cwd, 'package.json')); // eslint-disable-line
  const permissionSets = packageJson.stripes ? packageJson.stripes.permissionSets : [];

  permissionSets.forEach(permission => console.log(permission.permissionName));
}

export default {
  command: 'perms',
  describe: 'View list of permissions for the current app (app context)',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
      ])
      .example('$0 app perms', 'View current app permissions')
      .example('$0 app perms | $0 perm assign --user diku_admin', 'Assign current app permissions to user diku_admin');
    return yargs;
  },
  handler: appPermsCommand,
};
