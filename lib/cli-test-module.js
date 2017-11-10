// TODO: helpers to include as dependencies
const Nightmare = require('@folio/ui-testing/xnightmare.js');
const config = require('@folio/ui-testing/folio-ui.config.js');
const helpers = require('@folio/ui-testing/helpers.js');
const path = require('path');

const cwd = path.resolve();

// TODO: assumes ui-app is the current working directory...
const tests = require(path.join(cwd, './test/ui-testing/new_user.js'));
const moduleInfo = require(path.join(cwd, './package.json'));

const meta = { testVersion: `${moduleInfo.name}:${moduleInfo.version}` };

// devtools
config.nightmare.openDevTools = { mode: 'detach' };
config.nightmare.show = true;

// host
config.url = 'http://localhost:3000';

try {
  tests.test({ config, helpers, meta });
} catch (err) {
  console.log('oh-no!', err);
}
