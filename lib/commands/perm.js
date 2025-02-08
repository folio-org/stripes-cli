import {
  assign,
  create,
  filter,
  list,
  unassign,
} from './perm/index.js';

export default {
  command: 'perm <command>',
  describe: 'Commands to manage UI module permissions',
  builder: yargs => yargs.command([
    assign,
    create,
    filter,
    list,
    unassign,
  ]),
  handler: () => {},
};
