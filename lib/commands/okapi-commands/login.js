const importLazy = require('import-lazy')(require);

const { promptHandler } = importLazy('../input-utils');
const AuthService = importLazy('../../okapi/auth-service');
const { applyOptions, authOptions, okapiOptions } = importLazy('../common-options');

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
  command: 'login <username> [password]', // TODO: Make this interactive
  describe: 'Log into an Okapi tenant persist the token.',
  builder: (yargs) => {
    yargs
      .positional('username', authOptions.username)
      .positional('password', authOptions.password)
      .demandOption(['okapi', 'tenant'], 'Okapi and tenant must be available (via options, config file, or env var) in order to login.')
      .example('$0 okapi login diku_admin --okapi http://localhost:9130 --tenant diku')
      .example('$0 okapi login diku_admin', 'Given okapi and tenant are already set');
    return applyOptions(yargs, Object.assign({}, okapiOptions));
  },
  handler: promptHandler({
    password: authOptions.password,
  }, loginCommand),
};
