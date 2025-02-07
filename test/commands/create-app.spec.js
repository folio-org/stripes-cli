import { expect } from 'chai';
import path from 'path';
import fs from 'fs-extra';
import { templates } from '../../lib/environment/inventory.js';
import createApp from '../../lib/create-app.js';

describe('The app create command', function () {
  beforeEach(function () {
    this.sandbox.stub(path, 'sep').returns('/');
    this.sandbox.stub(fs, 'readFileSync').returns('__appDescription__');
    this.sandbox.stub(fs, 'writeFileSync');
    this.sandbox.stub(fs, 'removeSync');
    this.sandbox.stub(fs, 'renameSync');
    this.sandbox.stub(fs, 'readdirSync').returns(['__appDir__', '__appName__.js']);

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
