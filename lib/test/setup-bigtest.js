import copy from 'kopy';
import path from 'path';
import fs from 'fs-extra';
import simpleGit from 'simple-git';
import { templates } from '../environment/inventory';

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
    console.error('Error setting up BigTest');
    console.info(err);
  });
}

export default {
  packages,
  setupBigTest
};
