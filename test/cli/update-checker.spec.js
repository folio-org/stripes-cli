const expect = require('chai').expect;
const Configstore = require('configstore');

const UpdateChecker = require('../../lib/cli/update-checker');

const packageJson = {
  name: '@folio/stripes-cli',
  version: '1.0.0',
  publishConfig: { registry: 'https://repository.folio.org/repository/npm-folio/' },
};

describe('update-checker', function () {
  beforeEach(function () {
    this.sut = new UpdateChecker(packageJson);
    this.sut.config = new Configstore('update-notifier-stripes-cli-test', {});
    this.sandbox.stub(console, 'log');
  });

  describe('notifyIfAvailable', function () {
    it('logs a message when a newer version is cached', function () {
      this.sandbox.stub(this.sut.config, 'get').returns('9.9.9');

      this.sut.notifyIfAvailable();

      expect(console.log).to.have.been.calledWithMatch(/1\.0\.0 -> 9\.9\.9/);
    });

    it('does not log when the cached version is not newer', function () {
      this.sandbox.stub(this.sut.config, 'get').returns('1.0.0');

      this.sut.notifyIfAvailable();

      expect(console.log).to.not.have.been.called;
    });

    it('does not log when nothing is cached yet', function () {
      this.sandbox.stub(this.sut.config, 'get').returns(undefined);

      this.sut.notifyIfAvailable();

      expect(console.log).to.not.have.been.called;
    });

    it('ignores a malformed cached version', function () {
      this.sandbox.stub(this.sut.config, 'get').returns('not-a-version');

      expect(() => this.sut.notifyIfAvailable()).to.not.throw();
      expect(console.log).to.not.have.been.called;
    });
  });

  describe('refreshIfStale', function () {
    it('skips the network check when the cache is fresh', function () {
      this.sandbox.stub(this.sut.config, 'get').withArgs('lastChecked').returns(Date.now());
      const fetchStub = this.sandbox.stub(global, 'fetch');

      return this.sut.refreshIfStale().then(() => {
        expect(fetchStub).to.not.have.been.called;
      });
    });

    it('fetches and caches the latest version when the cache is stale', function () {
      this.sandbox.stub(this.sut.config, 'get').withArgs('lastChecked').returns(0);
      const setStub = this.sandbox.stub(this.sut.config, 'set');
      this.sandbox.stub(global, 'fetch').resolves({
        ok: true,
        json: () => Promise.resolve({ 'dist-tags': { latest: '2.0.0' } }),
      });

      return this.sut.refreshIfStale().then(() => {
        expect(setStub).to.have.been.calledWith('latestVersion', '2.0.0');
      });
    });

    it('does not throw when the registry is unreachable', function () {
      this.sandbox.stub(this.sut.config, 'get').withArgs('lastChecked').returns(0);
      this.sandbox.stub(this.sut.config, 'set');
      this.sandbox.stub(global, 'fetch').rejects(new Error('network down'));

      return this.sut.refreshIfStale();
    });
  });

  describe('check', function () {
    it('skips entirely for non-global installs', function () {
      this.sut.isInstalledGlobally = false;
      const notifySpy = this.sandbox.spy(this.sut, 'notifyIfAvailable');

      return this.sut.check().then(() => {
        expect(notifySpy).to.not.have.been.called;
      });
    });

    it('skips entirely in CI, even for global installs', function () {
      this.sut.isInstalledGlobally = true;
      this.sandbox.stub(process, 'env').value({ ...process.env, CI: 'true' });
      const notifySpy = this.sandbox.spy(this.sut, 'notifyIfAvailable');

      return this.sut.check().then(() => {
        expect(notifySpy).to.not.have.been.called;
      });
    });

    it('runs the notify/refresh cycle for global installs', function () {
      this.sut.isInstalledGlobally = true;
      this.sandbox.stub(process, 'env').value({ ...process.env, CI: '' });
      this.sandbox.stub(process, 'stdout').value({ isTTY: true });
      const notifySpy = this.sandbox.spy(this.sut, 'notifyIfAvailable');
      const refreshStub = this.sandbox.stub(this.sut, 'refreshIfStale').resolves();

      return this.sut.check().then(() => {
        expect(notifySpy).to.have.been.called;
        expect(refreshStub).to.have.been.called;
      });
    });
  });
});
