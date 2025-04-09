import { promptMiddleware } from '../../cli/prompt-middleware.js';
import Okapi from '../../okapi/index.js';
import AuthService from '../../okapi/auth-service.js';
import { authOptions, okapiRequired, tenantRequired } from '../common-options.js';

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

export default {
  command: 'login <username> [password]',
  describe: 'Log into an Okapi tenant persist the token',
  builder: (yargs) => {
    yargs
      .middleware([
        promptMiddleware({
          password: authOptions.password,
        }),
      ])
      .positional('username', authOptions.username)
      .positional('password', authOptions.password)
      .options(Object.assign({}, okapiRequired, tenantRequired))
      .demandOption(['okapi', 'tenant'], 'Okapi and tenant must be available (via options, config file, or env var) in order to login.')
      .example('$0 okapi login diku_admin --okapi http://localhost:9130 --tenant diku', 'Log user diku_admin into tenant diku')
      .example('$0 okapi login diku_admin', 'Login with okapi and tenant already set');
  },
  handler: loginCommand,
};
