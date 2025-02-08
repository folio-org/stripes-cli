import {
  cookies,
  login,
  logout,
  pathDelete,
  pathGet,
  pathPost,
  pathPut,
  token,
} from './okapi/index.js';

export default {
  command: 'okapi <command>',
  describe: 'Okapi commands (login and logout)',
  builder: yargs => yargs.command([
    cookies,
    login,
    logout,
    pathDelete,
    pathGet,
    pathPost,
    pathPut,
    token,
  ]),
  handler: () => {},
};
