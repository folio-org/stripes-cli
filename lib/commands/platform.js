import {
  backend,
  clean,
  install,
  pull,
} from './platform/index.js';

export default {
  command: 'platform <command>',
  describe: 'Commands to manage stripes UI platforms',
  builder: yargs => yargs.command([
    backend,
    clean,
    install,
    pull,
  ]),
  handler: () => {},
};
