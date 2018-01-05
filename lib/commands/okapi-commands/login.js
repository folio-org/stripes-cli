const importLazy = require('import-lazy')(require);

const AuthService = importLazy('../../okapi/auth-service');
const { applyOptions, okapiOptions } = importLazy('../common-options');

function loginCommand(argv) {
  // TODO: Validate okapi url...
  const authService = new AuthService(argv.okapi, argv.tenant);
  authService.login(argv.username, argv.password)
    .then(() => {
      console.log(`User ${argv.username} logged into tenant ${argv.tenant} on Okapi ${argv.okapi}`);
    })
    .catch(err => console.log('Error logging in.', err));
}

module.exports = {
  command: 'login <username> <password>', // TODO: Make this interactive
  describe: 'Log into an Okapi tenant persist the token.',
  builder: (yargs) => {
    yargs.positional('username', {
      describe: 'Okapi tenant admin username',
      type: 'string',
    });
    yargs.positional('password', {
      describe: 'Okapi tenant admin password',
      type: 'string',
    });
    return applyOptions(yargs, Object.assign({}, okapiOptions));
  },
  handler: loginCommand,
};
