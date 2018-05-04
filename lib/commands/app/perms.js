const importLazy = require('import-lazy')(require);

const path = importLazy('path');
const { mainHandler } = importLazy('../../cli/main-handler');

function appPermsCommand(argv, context) {
  if (context.type !== 'app') {
    console.log('"app perms" only works in the APP context');
    return;
  }

  const packageJson = require(path.join(context.cwd, 'package.json')); // eslint-disable-line
  const permissionSets = packageJson.stripes ? packageJson.stripes.permissionSets : [];

  permissionSets.forEach(permission => console.log(permission.permissionName));
}

module.exports = {
  command: 'perms',
  describe: 'View list of permissions for the current app (app context)',
  builder: (yargs) => {
    yargs
      .example('$0 app perms', '');
    return yargs;
  },
  handler: mainHandler(appPermsCommand),
};
