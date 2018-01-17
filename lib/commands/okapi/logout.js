const importLazy = require('import-lazy')(require);

const AuthService = importLazy('../../okapi/auth-service');

function logoutCommand(argv) {
  const authService = new AuthService(argv.okapi, argv.tenant);
  return authService.logout()
    .then(() => console.log('Logged out'))
    .catch(err => console.log('Error logging out', err));
}

module.exports = {
  command: 'logout',
  describe: 'Clear previously saved Okapi token.',
  builder: yargs => yargs,
  handler: logoutCommand,
};
