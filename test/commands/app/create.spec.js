const expect = require('chai').expect;

const context = require('../../../lib/cli/context');
const yarn = require('../../../lib/yarn');
const createApp = require('../../../lib/create-app');
const appCreateCommand = require('../../../lib/commands/app/create');
const addModCommand = require('../../../lib/commands/mod/add');
const enableModCommand = require('../../../lib/commands/mod/enable');
const assignPermissionCommand = require('../../../lib/commands/perm/assign');


const yarnStub = () => Promise.resolve({
  isInstalled: true,
  appDir: 'ui-hello-world',
});
const createAppStub = () => Promise.resolve({
  appName: 'hello-world',
  appDir: 'ui-hello-world',
});
const addModStub = () => Promise.resolve({
  success: true,
  id: 'hello-world'
});

describe('The app create command', function () {
  beforeEach(function () {
    this.argv = {
      name: 'hello world',
      desc: 'my first app',
    };
    this.argv.cliContext = {
      type: 'empty',
      cwd: '/path/to/working/directory',
      isEmpty: true,
    };
    this.sut = appCreateCommand;
    this.sandbox.stub(context, 'getContext').returns(this.argv.cliContext);
    this.sandbox.stub(createApp, 'createApp').callsFake(createAppStub);
    this.sandbox.stub(yarn, 'install').callsFake(yarnStub);
    this.sandbox.stub(addModCommand, 'handler').callsFake(addModStub);
    this.sandbox.stub(enableModCommand, 'handler').callsFake(() => Promise.resolve());
    this.sandbox.stub(assignPermissionCommand, 'handler').callsFake(() => Promise.resolve());
    this.sandbox.spy(console, 'log');
  });

  it('calls create app service', function (done) {
    this.sut.handler(this.argv)
      .then(() => {
        expect(createApp.createApp).to.have.been.calledWith('hello world', 'my first app');
        done();
      });
  });

  it('does not create an app when run from within an app', function (done) {
    this.argv.cliContext.isUiModule = true;
    this.argv.cliContext.isEmpty = false;
    this.sut.handler(this.argv)
      .then(() => {
        expect(createApp.createApp).not.to.have.been.called;
        expect(console.log).to.have.been.calledWithMatch('Nothing created');
        done();
      });
  });

  it('yarn installs dependencies in the app directory', function (done) {
    this.argv.install = true;
    this.sut.handler(this.argv)
      .then(() => {
        expect(yarn.install).to.have.been.calledWith('/path/to/working/directory/ui-hello-world');
        expect(console.log).to.have.been.calledWithMatch('then "stripes serve" to run your new app');
        done();
      });
  });

  it('yarn installs dependencies in the workspace directory', function (done) {
    this.argv.install = true;
    this.argv.cliContext.isWorkspace = true;
    this.argv.cliContext.isEmpty = false;
    this.sut.handler(this.argv)
      .then(() => {
        expect(yarn.install).to.have.been.calledWith('/path/to/working/directory');
        expect(console.log).to.have.been.calledWithMatch('then "stripes serve" to run your new app');
        done();
      });
  });

  it('reports install instructions for --no-install', function (done) {
    this.argv.install = false;
    this.sut.handler(this.argv)
      .then(() => {
        expect(yarn.install).not.to.have.been.called;
        expect(console.log).to.have.been.calledWithMatch('"cd ui-hello-world", "yarn install",');
        done();
      });
  });

  it('reports workspace install instructions for --no-install', function (done) {
    this.argv.install = false;
    this.argv.cliContext.isWorkspace = true;
    this.argv.cliContext.isEmpty = false;
    this.sut.handler(this.argv)
      .then(() => {
        expect(yarn.install).not.to.have.been.called;
        expect(console.log).to.have.been.calledWithMatch('"yarn install", "cd ui-hello-world",');
        done();
      });
  });

  it('calls "mod add" handler to post the new ui-app module descriptor to okapi', function (done) {
    this.argv.assign = 'username';
    this.sut.handler(this.argv)
      .then(() => {
        expect(addModCommand.handler).to.have.been.calledOnce;
        expect(console.log).to.have.been.calledWithMatch('added to Okapi');
        done();
      });
  });

  it('reports when the new ui-app module descriptor already exists', function (done) {
    this.argv.assign = 'username';
    addModCommand.handler.restore();
    this.sandbox.stub(addModCommand, 'handler').callsFake(() => Promise.resolve({ alreadyExists: true }));
    this.sut.handler(this.argv)
      .then(() => {
        expect(addModCommand.handler).to.have.been.calledOnce;
        expect(console.log).to.have.been.calledWithMatch('Okapi already has a module with id');
        done();
      });
  });

  it('calls "mod enable" handler to enable the new ui-app module for a tenant', function (done) {
    this.argv.assign = 'username';
    this.sut.handler(this.argv)
      .then(() => {
        expect(enableModCommand.handler).to.have.been.calledOnce;
        done();
      });
  });

  it('calls "perm assign" handler assign new ui-app permissions to a user', function (done) {
    this.argv.assign = 'username';
    this.sut.handler(this.argv)
      .then(() => {
        expect(assignPermissionCommand.handler).to.have.been.calledWithMatch({
          assign: 'username',
          name: ['module.hello-world.enabled', 'settings.hello-world.enabled'],
        });
        done();
      });
  });
});
