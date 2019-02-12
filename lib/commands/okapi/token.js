const importLazy = require('import-lazy')(require);

const AuthService = importLazy('../../okapi/auth-service');

function viewTokenCommand() {
  const authService = new AuthService();
  authService.getToken().then((token) => {
    console.log(token);
  });
}

module.exports = {
  command: 'token',
  describe: 'Display the stored Okapi token',
  builder: yargs => yargs.example('$0 okapi token', 'Display the stored Okapi token'),
  handler: viewTokenCommand,
};
