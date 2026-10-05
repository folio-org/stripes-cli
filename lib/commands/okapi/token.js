import AuthService from '../../okapi/auth-service.js';

function viewTokenCommand() {
  const authService = new AuthService();
  authService.getToken().then((token) => {
    console.log(token);
  });
}

export default {
  command: 'token',
  describe: 'Display the stored Okapi token',
  builder: yargs => yargs.example('$0 okapi token', 'Display the stored Okapi token'),
  handler: viewTokenCommand,
};
