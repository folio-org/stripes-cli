import AuthService from '../../okapi/auth-service.js';

function logoutCommand(argv) {
  const authService = new AuthService(argv.okapi, argv.tenant);
  return authService.logout()
    .then(() => console.log('Logged out'))
    .catch(err => console.log('Error logging out', err));
}

export default {
  command: 'logout',
  describe: 'Clear previously saved Okapi token.',
  builder: yargs => yargs,
  handler: logoutCommand,
};
