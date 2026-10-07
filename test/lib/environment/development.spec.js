const expect = require('chai').expect;
const path = require('path');

const packageManager = require('../../../lib/package-manager');
const DevelopmentEnvironment = require('../../../lib/environment/development');

describe('The DevelopmentEnvironment', function () {
  describe('installDependencies method', function () {
    beforeEach(function () {
      this.projectDir = path.join('root', 'workspace');
      this.install = this.sandbox.stub(packageManager, 'install').resolves();
    });

    describe('within a workspace', function () {
      beforeEach(function () {
        this.dev = new DevelopmentEnvironment(this.projectDir, true);
        this.dev.validModules = ['module-a', 'module-b'];
      });

      it('installs once for the workspace when no aliases point outside it', function () {
        return this.dev.installDependencies().then(() => {
          expect(this.install).to.have.been.calledOnce;
          expect(this.install).to.have.been.calledWith(this.projectDir);
        });
      });

      it('does not separately install an alias that resolves inside the workspace', function () {
        this.dev.aliases = {
          '@folio/module-a': { path: path.join(this.projectDir, 'module-a') },
        };

        return this.dev.installDependencies().then(() => {
          expect(this.install).to.have.been.calledOnce;
          expect(this.install).to.have.been.calledWith(this.projectDir);
        });
      });

      it('installs an alias outside the workspace only after the workspace install resolves', function () {
        const aliasPath = path.join('root', 'elsewhere', 'module-a');
        this.dev.aliases = {
          '@folio/module-a': { path: aliasPath },
        };

        let resolveWorkspaceInstall;
        this.install.withArgs(this.projectDir).returns(new Promise((resolve) => {
          resolveWorkspaceInstall = resolve;
        }));
        this.install.withArgs(aliasPath).resolves();

        const result = this.dev.installDependencies();

        // The alias install must not be attempted until the workspace install settles.
        expect(this.install).to.have.been.calledOnce;

        resolveWorkspaceInstall();

        return result.then(() => {
          expect(this.install).to.have.been.calledTwice;
          expect(this.install.getCall(0)).to.have.been.calledWith(this.projectDir);
          expect(this.install.getCall(1)).to.have.been.calledWith(aliasPath);
        });
      });

      it('installs one alias per module outside the workspace', function () {
        const aliasPathA = path.join('root', 'elsewhere', 'module-a');
        const aliasPathB = path.join('root', 'elsewhere', 'module-b');
        this.dev.aliases = {
          '@folio/module-a': { path: aliasPathA },
          '@folio/module-b': { path: aliasPathB },
        };

        return this.dev.installDependencies().then(() => {
          expect(this.install).to.have.been.calledThrice;
          expect(this.install).to.have.been.calledWith(this.projectDir);
          expect(this.install).to.have.been.calledWith(aliasPathA);
          expect(this.install).to.have.been.calledWith(aliasPathB);
        });
      });

      it('rejects without attempting the alias install when the workspace install fails', function () {
        const aliasPath = path.join('root', 'elsewhere', 'module-a');
        this.dev.aliases = {
          '@folio/module-a': { path: aliasPath },
        };
        const failure = new Error('workspace install failed');
        this.install.withArgs(this.projectDir).rejects(failure);
        this.install.withArgs(aliasPath).resolves();

        return this.dev.installDependencies().then(
          () => { throw new Error('expected installDependencies to reject'); },
          (err) => {
            expect(err).to.equal(failure);
            expect(this.install).to.have.been.calledOnce;
          }
        );
      });
    });

    describe('outside a workspace', function () {
      beforeEach(function () {
        this.dev = new DevelopmentEnvironment(this.projectDir, false);
        this.dev.validModules = ['module-a', 'module-b', 'module-c'];
      });

      it('installs each module path once, in order', function () {
        return this.dev.installDependencies().then(() => {
          expect(this.install).to.have.been.calledThrice;
          expect(this.install.getCall(0)).to.have.been.calledWith(path.join(this.projectDir, 'module-a'));
          expect(this.install.getCall(1)).to.have.been.calledWith(path.join(this.projectDir, 'module-b'));
          expect(this.install.getCall(2)).to.have.been.calledWith(path.join(this.projectDir, 'module-c'));
        });
      });

      it('installs sequentially, not attempting the next module until the previous one resolves', function () {
        const moduleAPath = path.join(this.projectDir, 'module-a');
        const moduleBPath = path.join(this.projectDir, 'module-b');

        let resolveModuleAInstall;
        this.install.withArgs(moduleAPath).returns(new Promise((resolve) => {
          resolveModuleAInstall = resolve;
        }));

        const result = this.dev.installDependencies();

        expect(this.install).to.have.been.calledOnce;

        resolveModuleAInstall();

        return result.then(() => {
          expect(this.install).to.have.been.calledThrice;
          expect(this.install.getCall(1)).to.have.been.calledWith(moduleBPath);
        });
      });

      it('rejects and stops the chain when a module install fails', function () {
        const moduleAPath = path.join(this.projectDir, 'module-a');
        const failure = new Error('module install failed');
        this.install.withArgs(moduleAPath).rejects(failure);

        return this.dev.installDependencies().then(
          () => { throw new Error('expected installDependencies to reject'); },
          (err) => {
            expect(err).to.equal(failure);
            expect(this.install).to.have.been.calledOnce;
          }
        );
      });
    });
  });
});
