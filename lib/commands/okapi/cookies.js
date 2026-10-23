import AuthService from '../../okapi/auth-service.js';

function viewCookiesCommand() {
  const authService = new AuthService();

  authService.getAccessCookie().then((token) => {
    console.log(token);
  });

  authService.getRefreshCookie().then((token) => {
    console.log(token);
  });
}

export default {
  command: 'cookies',
  describe: 'Display the stored cookies',
  builder: yargs => yargs.example('$0 okapi cookies', 'Display the stored cookies'),
  handler: viewCookiesCommand,
};
