const expect = require('chai').expect;
const path = require('path');

const DevelopmentEnvironment = require('../../lib/environment/development');
const workspaceCommand = require('../../lib/commands/workspace');

describe('The workspace command', function () {
  beforeEach(function () {
    this.argv = {
      context: {
        cwd: path.join('root', 'working-directory'),
        isEmpty: true,
      },
      modules: ['ui-users', 'stripes-core'],
      dir: 'stripes',
      clone: true,
      install: true,
      default: {
        okapi: 'http://localhost:9130',
        tenant: 'diku',
      },
    };
    this.sut = workspaceCommand;

    this.selectNewModules = this.sandbox.stub(DevelopmentEnvironment.prototype, 'selectNewModules');
    this.createDirectory = this.sandbox.stub(DevelopmentEnvironment.prototype, 'createDirectory').resolves();
    this.cloneRepositories = this.sandbox.stub(DevelopmentEnvironment.prototype, 'cloneRepositories').resolves();
    this.installDependencies = this.sandbox.stub(DevelopmentEnvironment.prototype, 'installDependencies').resolves();
    this.initializeStripesConfig = this.sandbox.stub(DevelopmentEnvironment.prototype, 'initializeStripesConfig').resolves();
    this.sandbox.spy(console, 'log');
  });

  it('reports when the current directory is not empty', function (done) {
    this.argv.context.isEmpty = false;

    this.sut.handler(this.argv).then(() => {
      expect(console.log).to.have.been.calledWith('Current directory has a package.json');
      expect(this.selectNewModules).not.to.have.been.called;
      done();
    });
  });

  it('reports when no modules are specified', function (done) {
    this.argv.modules = undefined;

    this.sut.handler(this.argv).then(() => {
      expect(console.log).to.have.been.calledWith('No modules specified.');
      expect(this.selectNewModules).not.to.have.been.called;
      done();
    });
  });

  it('reports unknown modules and stops', function (done) {
    this.argv.modules = ['not-a-real-module'];

    this.sut.handler(this.argv).then(() => {
      expect(console.log).to.have.been.calledWith('The following modules are unknown:', ['not-a-real-module']);
      expect(this.createDirectory).not.to.have.been.called;
      done();
    });
  });

  it('creates the directory, clones, installs, and initializes config', function (done) {
    this.sut.handler(this.argv).then(() => {
      expect(this.createDirectory).to.have.been.calledWith(this.argv.default);
      expect(this.cloneRepositories).to.have.been.calledOnce;
      expect(this.installDependencies).to.have.been.calledOnce;
      expect(this.initializeStripesConfig).to.have.been.calledOnce;
      expect(console.log).to.have.been.calledWith('\nDone.');
      done();
    });
  });

  it('skips cloning and config initialization when --no-clone is passed', function (done) {
    this.argv.clone = false;

    this.sut.handler(this.argv).then(() => {
      expect(this.cloneRepositories).not.to.have.been.called;
      expect(this.initializeStripesConfig).not.to.have.been.called;
      expect(console.log).to.have.been.calledWith('\nOption "--no-clone" provided. No repositories cloned. Aliases will not be configured.');
      expect(console.log).to.have.been.calledWith('Warning: New "stripes" workspace has no modules because of "--no-clone" option.');
      done();
    });
  });

  it('skips installing dependencies when --no-install is passed', function (done) {
    this.argv.install = false;

    this.sut.handler(this.argv).then(() => {
      expect(this.installDependencies).not.to.have.been.called;
      expect(console.log).to.have.been.calledWith('\nOption "--no-install" provided. Please manually install dependencies.');
      done();
    });
  });

  it('reports available platforms and UI modules after cloning', function (done) {
    this.selectNewModules.callsFake(function (modules) {
      this.validModules = modules;
    });
    this.argv.modules = ['platform-core', 'ui-users'];

    this.sut.handler(this.argv).then(() => {
      expect(console.log).to.have.been.calledWith('\nPlatforms available: "platform-core"');
      expect(console.log).to.have.been.calledWith('  "cd" into the above dir(s) and run "stripes serve stripes.config.js.local" to start.');
      expect(console.log).to.have.been.calledWith('\nUI modules available: "ui-users"');
      done();
    });
  });
});
