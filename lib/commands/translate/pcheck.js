/**
 * pcheck
 * examine package.json and the en.json translations
 * to find permissions that lack translations keys.
 * print missing permissions and exit 1 if any are
 * missing; otherwise exit 0.
 *
 */

import fs from 'fs';
import path from 'path';

import { contextMiddleware } from '../../cli/context-middleware.js';

function pcheckCommand(argv) {
  const context = argv.context;

  const basename = path.basename(context.cwd);
  const pkgPath = path.join(context.cwd, 'package.json');
  const enPath = path.join(context.cwd, 'translations', basename, 'en.json');
  const en = JSON.parse(fs.readFileSync(enPath));
  const pkg = JSON.parse(fs.readFileSync(pkgPath));

  let ret = 0;
  const psets = pkg.stripes.permissionSets;
  psets.forEach(p => {
    const name = `permission${p.permissionName.substring(basename.length)}`;
    if (p.visible && !en[name]) {
      console.warn(`Could not find a translation for ${name}.`);
      ret = 1;
    }
  });

  if (ret !== 0) {
    process.exit(ret);
  }
}

export default {
  command: 'pcheck',
  describe: 'validate that permissions have translation keys',
  builder: (yargs) => {
    yargs.middleware([
      contextMiddleware(),
    ]);
    yargs.example('$0 translate pcheck', 'Validate that visible permissions have translation keys.');
    return yargs;
  },
  handler: pcheckCommand,
};
