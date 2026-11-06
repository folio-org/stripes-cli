import AuthService from '../../okapi/auth-service.js';

async function viewCookiesCommand() {
  const authService = new AuthService();

  console.log(await authService.getAccessCookie());
  console.log(await authService.getRefreshCookie());
}

export default {
  command: 'cookies',
  describe: 'Display the stored cookies',
  builder: yargs => yargs.example('$0 okapi cookies', 'Display the stored cookies'),
  handler: viewCookiesCommand,
};
