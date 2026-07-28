const expect = require('chai').expect;
const path = require('path');
const fs = require('fs');
const os = require('os');

const packageManager = require('../../../lib/package-manager');
const DevelopmentEnvironment = require('../../../lib/environment/development');
const cleanCommand = require('../../../lib/commands/platform/clean');

describe('The platform clean command', function () {
  beforeEach(function () {
    this.argv = {
      context: {
        cwd: path.join('root', 'workspace'),
        isWorkspace: true,
        isPlatform: false,
      },
      install: false,
      removeLock: false,
    };
    this.sut = cleanCommand;

    this.loadExistingModules = this.sandbox.stub(DevelopmentEnvironment.prototype, 'loadExistingModules');
    this.getModulePaths = this.sandbox.stub(DevelopmentEnvironment.prototype, 'getModulePaths').returns([]);
    this.installDependencies = this.sandbox.stub(DevelopmentEnvironment.prototype, 'installDependencies').resolves();
    this.sandbox.spy(console, 'log');
    this.sandbox.spy(console, 'error');
  });

  it('requires a platform or workspace context', function () {
    this.argv.context.isWorkspace = false;
    this.argv.context.isPlatform = false;

    return this.sut.handler(this.argv).then(() => {
      expect(console.log).to.have.been.calledWith('This command must be run from a platform or workspace context');
      expect(this.getModulePaths).not.to.have.been.called;
    });
  });

  describe('with no existing files found', function () {
    beforeEach(function () {
      this.sandbox.stub(fs, 'existsSync').returns(false);
    });

    it('cleans node_modules for each module directory', function () {
      const moduleDirs = [path.join('root', 'workspace', 'module-a'), path.join('root', 'workspace', 'module-b')];
      this.getModulePaths.returns(moduleDirs);

      return this.sut.handler(this.argv).then(() => {
        expect(console.log).to.have.been.calledWith('Cleaning 2 directories ...');
        moduleDirs.forEach((dir) => {
          expect(console.log).to.have.been.calledWith(`Not found "${path.resolve(dir, 'node_modules')}`);
        });
        expect(this.installDependencies).not.to.have.been.called;
        expect(console.log).to.have.been.calledWith('Done.');
      });
    });

    it('checks for every known lock file in addition to node_modules when --removeLock is set', function () {
      const moduleDir = path.join('root', 'workspace', 'module-a');
      this.getModulePaths.returns([moduleDir]);
      this.argv.removeLock = true;

      return this.sut.handler(this.argv).then(() => {
        expect(console.log).to.have.been.calledWith('Removing 1 lock file(s) ...');
        expect(fs.existsSync).to.have.been.calledWith(path.resolve(moduleDir, 'node_modules'));
        packageManager.lockfiles.forEach((lockfile) => {
          expect(fs.existsSync).to.have.been.calledWith(path.resolve(moduleDir, lockfile));
        });
      });
    });

    it('does not check for lock files when --removeLock is not set', function () {
      const moduleDir = path.join('root', 'workspace', 'module-a');
      this.getModulePaths.returns([moduleDir]);

      return this.sut.handler(this.argv).then(() => {
        packageManager.lockfiles.forEach((lockfile) => {
          expect(fs.existsSync).not.to.have.been.calledWith(path.resolve(moduleDir, lockfile));
        });
      });
    });

    it('installs dependencies after cleaning when --install is set', function () {
      this.argv.install = true;

      return this.sut.handler(this.argv).then(() => {
        expect(console.log).to.have.been.calledWith('Installing dependencies ...');
        expect(this.installDependencies).to.have.been.calledOnce;
        expect(console.log).to.have.been.calledWith('Done.');
      });
    });
  });

  describe('against a real filesystem', function () {
    beforeEach(function () {
      this.tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stripes-cli-clean-test-'));
      fs.mkdirSync(path.join(this.tmpDir, 'node_modules'));
      fs.writeFileSync(path.join(this.tmpDir, 'yarn.lock'), '');
      this.getModulePaths.returns([this.tmpDir]);
    });

    afterEach(function () {
      fs.rmSync(this.tmpDir, { recursive: true, force: true });
    });

    it('actually removes node_modules and lock files', function () {
      this.argv.removeLock = true;

      return this.sut.handler(this.argv).then(() => {
        expect(fs.existsSync(path.join(this.tmpDir, 'node_modules'))).to.be.false;
        expect(fs.existsSync(path.join(this.tmpDir, 'yarn.lock'))).to.be.false;
      });
    });
  });
});
