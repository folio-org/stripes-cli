/**
 * stats
 * calculate completeness of translations for each locale by comparison to en_US
 *
 */
const importLazy = require('import-lazy')(require);

const fs = importLazy('fs');
const path = importLazy('path');
const _ = importLazy('lodash');

const { contextMiddleware } = importLazy('../../cli/context-middleware');

const localeFormat = (s) => _.padStart(s.substr(0, s.indexOf('.')), 6);
const nFormat = (n) => _.padStart(Math.floor(n), 3);

function statsCommand(argv) {
  const context = argv.context;
  const basename = path.basename(context.cwd);
  const txPath = path.join(context.cwd, 'translations', basename);
  const enPath = path.join(context.cwd, 'translations', basename, 'en_US.json');

  const locales = fs.readdirSync(txPath, { withFileTypes: true });
  const en = JSON.parse(fs.readFileSync(enPath));
  const count = Object.values(en).length;

  locales.forEach(l => {
    if (l.isFile() && l.name !== 'en.json' && l.name !== 'en_US.json') {
      const locale = JSON.parse(fs.readFileSync(path.join(txPath, l.name)));
      // count intersecting values
      const int = Object.values(en).filter(v => Object.values(locale).includes(v)).length;

      console.log(`${localeFormat(l.name)} ${nFormat(((count - int) / count) * 100)}% ${count - int}/${count} `);
    }
  });
}

module.exports = {
  command: 'stats',
  describe: 'Show completeness of translations for each locale',
  builder: (yargs) => {
    yargs.middleware([
      contextMiddleware(),
    ]);
    yargs.example('$0 translate stats', 'Show completeness of translations for each locale.');
    return yargs;
  },
  handler: statsCommand,
};
