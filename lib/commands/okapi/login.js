const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const { promptHandler } = importLazy('../../cli/questions');
const Okapi = importLazy('../../okapi');
const AuthService = importLazy('../../okapi/auth-service');
const { applyOptions, authOptions, okapiRequired, tenantRequired } = importLazy('../common-options');

function loginCommand(argv) {
  const okapi = new Okapi(argv.okapi, argv.tenant);
  const authService = new AuthService(okapi);

  return authService.login(argv.username, argv.password)
    .then(() => {
      console.log(`User ${argv.username} logged into tenant ${argv.tenant} on Okapi ${argv.okapi}`);
    })
    .catch((err) => {
      console.log('Error logging in.', err);
    });
}

module.exports = {
  command: 'login <username> [password]',
  describe: 'Log into an Okapi tenant persist the token',
  builder: (yargs) => {
    yargs
      .positional('username', authOptions.username)
      .positional('password', authOptions.password)
      .demandOption(['okapi', 'tenant'], 'Okapi and tenant must be available (via options, config file, or env var) in order to login.')
      .example('$0 okapi login diku_admin --okapi http://localhost:9130 --tenant diku')
      .example('$0 okapi login diku_admin', 'Given okapi and tenant are already set');
    return applyOptions(yargs, Object.assign({}, okapiRequired, tenantRequired));
  },
  handler: mainHandler(promptHandler({
    password: authOptions.password,
  }, loginCommand)),
};
