// cli-test-module.js serves as a test loader called by mocha,
// replicating behavior found in @folio/ui-testing/test-module.js
//
// This version modified in the following ways:
//  - Simplified to support limited options in use by stripes-cli
//  - Supports cwd of the ui-app module under test

const Nightmare = require('@folio/ui-testing/xnightmare.js');
const config = require('@folio/ui-testing/folio-ui.config.js');
const helpers = require('@folio/ui-testing/helpers.js');
const path = require('path');
const argv = require('yargs').argv;

// TODO: Verify that cwd is the app under test
const cwd = path.resolve();
const packageJson = require(path.join(cwd, './package.json')); // eslint-disable-line

const testScript = argv.run || 'test';
const tests = require(path.join(cwd, 'test/ui-testing/', testScript)); // eslint-disable-line

const meta = { testVersion: `${packageJson.name}:${packageJson.version}` };

// devtools
if (argv.devTools) {
  config.nightmare.openDevTools = { mode: 'detach' };
  config.nightmare.show = true;
}

// host
config.url = argv.url || 'http://localhost:3000';

try {
  tests.test({ config, helpers, meta });
} catch (err) {
  console.log('oh-no!', err);
}
