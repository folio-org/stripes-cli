const expect = require('chai').expect;
const path = require('path');
const fs = require('fs-extra');
const simpleGit = require('simple-git/src/git');

const { templates } = require('../../lib/environment/inventory');
const createApp = require('../../lib/create-app');

describe('The app create command', function () {
  beforeEach(function () {
    this.sandbox.stub(path, 'sep').returns('/');
    this.sandbox.stub(fs, 'readFileSync').returns('');
    this.sandbox.stub(fs, 'writeFileSync');
    this.sandbox.stub(fs, 'removeSync');
    this.sandbox.stub(simpleGit.prototype, '_run').callsFake(function (command, cb) {
      console.log('called command', command);

      // to indicate success (will resolve eventual promise)
      cb.call(this, null, 'any message');

      // OR to indicate failure (will reject eventual promise)
      simpleGit.fail(this, 'error message', cb);

      return this;
    });
    this.sandbox.stub(templates, 'uiApp').returns('gitUrl');
  });

  it('calls appDefaults with expected responses', function (done) {
    const result = createApp.appDefaults('test', 'test description');

    expect(result.uiAppName).to.eq('ui-test');
    expect(result.appDescription).to.eq('test description');
    done();
  });

  it('calls createApp with expected responses', function (done) {
    createApp.createApp('test', 'test description').then((result) => {
      expect(result.uiAppName).to.eq('ui-test');
      expect(result.appDescription).to.eq('test description');
      done();
    });
  });
});
