const copy = require('kopy');
const path = require('path');
const fs = require('fs-extra');
const simpleGit = require('simple-git/promise');
const { templates } = require('../environment/inventory');

const tempDir = '_bigtest_temp';
const bigTestDir = 'test/bigtest';

const packages = [
  '@bigtest/interactor',
  '@bigtest/mirage',
  '@bigtest/mocha',
  '@bigtest/react',
  '@folio/stripes-core',
  'babel-polyfill@^6.26.0',
  'chai',
  'mocha',
  'sinon'
];

async function setupBigTest() {
  await simpleGit().silent(true).clone(templates.uiApp, tempDir);
  const localTemp = `./${tempDir}`;

  const templateDir = path.resolve(`./${tempDir}/${bigTestDir}`);
  const testDir = path.resolve(`./${bigTestDir}`);

  return copy(templateDir, testDir, { clean: false }).then(() => {
    fs.removeSync(localTemp);
    console.log('BigTest setup successfully');
  }).catch((err) => {
    console.log(err.stack);
  });
}

module.exports = {
  packages,
  setupBigTest
};
