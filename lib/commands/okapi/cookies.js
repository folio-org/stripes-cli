const importLazy = require('import-lazy')(require);

const AuthService = importLazy('../../okapi/auth-service');

function viewCookiesCommand() {
  const authService = new AuthService();

  authService.getAccessCookie().then((token) => {
    console.log(token);
  });

  authService.getRefreshCookie().then((token) => {
    console.log(token);
  });
}

module.exports = {
  command: 'cookies',
  describe: 'Display the stored cookies',
  builder: yargs => yargs.example('$0 okapi cookies', 'Display the stored cookies'),
  handler: viewCookiesCommand,
};
