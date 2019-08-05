const expect = require('chai').expect;
const path = require('path');
const fs = require('fs-extra');
const simpleGit = require('simple-git/src/git');

const { templates } = require('../../lib/environment/inventory');
const createApp = require('../../lib/create-app');

describe('The app create command', function () {
  beforeEach(function () {
    this.sandbox.stub(path, 'sep').returns('/');
    this.sandbox.stub(fs, 'readFileSync').returns('__appDescription__');
    this.sandbox.stub(fs, 'writeFileSync');
    this.sandbox.stub(fs, 'removeSync');
    this.sandbox.stub(fs, 'renameSync');
    this.sandbox.stub(fs, 'readdirSync').returns(['__appDir__', '__appName__.js']);
    this.sandbox.stub(simpleGit.prototype, '_run').callsFake(function (command, cb) {
      console.log('called command', command);

      // to indicate success (will resolve eventual promise)
      cb.call(this, null, 'any message');

      // OR to indicate failure (will reject eventual promise)
      simpleGit.fail(this, 'error message', cb);

      return this;
    });
    this.sandbox.stub(templates, 'uiApp').returns('gitUrl');

    const statSyncStub = this.sandbox.stub(fs, 'statSync');
    statSyncStub.withArgs('./ui-test/__appDir__').returns({ isDirectory() { return true; } });
    statSyncStub.withArgs('./ui-test/__appName__.js').returns({ isDirectory() { return false; } });
    statSyncStub.withArgs('./ui-test/__appDir__/__appDir__').returns({ isDirectory() { return false; } });
    statSyncStub.withArgs('./ui-test/__appDir__/__appName__.js').returns({ isDirectory() { return false; } });
  });

  it('calls appDefaults with expected responses', function (done) {
    const result = createApp.appDefaults('ui-test', 'test description');

    expect(result.uiAppName).to.eq('ui-test');
    expect(result.appDescription).to.eq('test description');
    done();
  });

  it('calls createApp with expected responses', function (done) {
    createApp.createApp('test').then((result) => {
      expect(result.uiAppName).to.eq('ui-test');
      expect(result.appDescription).to.eq('Description for test');
      done();
    });
  });
});
