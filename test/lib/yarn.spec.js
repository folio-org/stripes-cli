const expect = require('chai').expect;

const packageManager = require('../../lib/package-manager');
const yarn = require('../../lib/yarn');

describe('The yarn service', function () {
  beforeEach(function () {
    this.sandbox.stub(console, 'log');
    this.sandbox.stub(console, 'error');
    this.sandbox.stub(console, 'info');
  });

  describe('install', function () {
    it('delegates to the package manager service', function () {
      const result = { isInstalled: true, appDir: '/path/to/project' };
      this.sandbox.stub(packageManager, 'install').resolves(result);

      return yarn.install('/path/to/project').then((res) => {
        expect(packageManager.install).to.have.been.calledWith('/path/to/project');
        expect(res).to.equal(result);
        expect(console.log).to.have.been.calledWithMatch('/path/to/project');
      });
    });

    it('reports and swallows an error from the package manager service', function () {
      const error = new Error('boom');
      this.sandbox.stub(packageManager, 'install').rejects(error);

      return yarn.install('/path/to/project').then((res) => {
        expect(res).to.be.undefined;
        expect(console.error).to.have.been.calledWithMatch('Something went wrong while attempting to use Yarn.');
        expect(console.info).to.have.been.calledWith(error);
      });
    });
  });

  describe('add', function () {
    it('delegates to the package manager service', function () {
      const result = { isInstalled: true, appDir: '/path/to/project' };
      this.sandbox.stub(packageManager, 'add').resolves(result);

      return yarn.add('/path/to/project', ['lodash'], true).then((res) => {
        expect(packageManager.add).to.have.been.calledWith('/path/to/project', ['lodash'], true);
        expect(res).to.equal(result);
        expect(console.log).to.have.been.calledWithMatch('/path/to/project');
      });
    });

    it('reports and swallows an error from the package manager service', function () {
      const error = new Error('boom');
      this.sandbox.stub(packageManager, 'add').rejects(error);

      return yarn.add('/path/to/project', ['lodash'], false).then((res) => {
        expect(res).to.be.undefined;
        expect(console.error).to.have.been.calledWithMatch('Something went wrong while attempting to add package via package manager.');
        expect(console.info).to.have.been.calledWith(error);
      });
    });
  });
});
