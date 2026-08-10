const expect = require('chai').expect;
const childProcess = require('node:child_process');
const fs = require('node:fs');
const { EventEmitter } = require('node:events');

const packageManager = require('../../lib/package-manager');

// Stubs childProcess.exec to simulate a successful or failed command,
// emitting stdout/stderr asynchronously so listeners attached by execCmd
// are in place before data arrives.
function stubExec(sandbox, { error, stdout, stderr } = {}) {
  return sandbox.stub(childProcess, 'exec').callsFake((command, options, callback) => {
    const proc = new EventEmitter();
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    setImmediate(() => {
      if (stdout) proc.stdout.emit('data', stdout);
      if (stderr) proc.stderr.emit('data', stderr);
      callback(error || null);
    });
    return proc;
  });
}

describe('The package-manager service', function () {
  let originalEnv;

  beforeEach(function () {
    originalEnv = process.env.STRIPES_PKG_MANAGER;
    delete process.env.STRIPES_PKG_MANAGER;
    this.sandbox.stub(console, 'log');
    this.sandbox.stub(console, 'error');
  });

  afterEach(function () {
    if (originalEnv === undefined) {
      delete process.env.STRIPES_PKG_MANAGER;
    } else {
      process.env.STRIPES_PKG_MANAGER = originalEnv;
    }
  });

  describe('detect', function () {
    it('honors the STRIPES_PKG_MANAGER environment variable', function () {
      process.env.STRIPES_PKG_MANAGER = 'npm';
      this.sandbox.stub(fs, 'existsSync');
      this.sandbox.stub(childProcess, 'execSync');

      expect(packageManager.detect('/project')).to.equal('npm');
      expect(fs.existsSync).not.to.have.been.called;
      expect(childProcess.execSync).not.to.have.been.called;
    });

    it('prefers pnpm when a pnpm-lock.yaml is present and pnpm is available', function () {
      this.sandbox.stub(fs, 'existsSync').returns(true);
      this.sandbox.stub(childProcess, 'execSync').returns('8.0.0');

      expect(packageManager.detect('/project')).to.equal('pnpm');
      expect(childProcess.execSync).to.have.been.calledWithMatch('pnpm --version');
    });

    it('falls back to yarn when pnpm is not installed', function () {
      this.sandbox.stub(fs, 'existsSync').returns(false);
      this.sandbox.stub(childProcess, 'execSync').callsFake((cmd) => {
        if (cmd.startsWith('pnpm')) throw new Error('command not found: pnpm');
        if (cmd.startsWith('yarn')) return '1.22.0';
        return '';
      });

      expect(packageManager.detect('/project')).to.equal('yarn');
    });

    it('falls back to npm when neither pnpm nor yarn is installed', function () {
      this.sandbox.stub(fs, 'existsSync').returns(false);
      this.sandbox.stub(childProcess, 'execSync').callsFake((cmd) => {
        if (cmd.startsWith('npm')) return '8.0.0';
        throw new Error('command not found');
      });

      expect(packageManager.detect('/project')).to.equal('npm');
    });

    it('defaults to npm when no other package manager is detected', function () {
      this.sandbox.stub(fs, 'existsSync').returns(false);
      this.sandbox.stub(childProcess, 'execSync').returns('');

      expect(packageManager.detect('/project')).to.equal('npm');
    });
  });

  describe('install', function () {
    it('installs with pnpm when pnpm is detected', function () {
      process.env.STRIPES_PKG_MANAGER = 'pnpm';
      const exec = stubExec(this.sandbox);

      return packageManager.install('/project').then((result) => {
        expect(exec).to.have.been.calledWithMatch('pnpm install', { cwd: '/project' });
        expect(result).to.eql({ isInstalled: true, appDir: '/project' });
      });
    });

    it('installs with yarn when yarn is detected', function () {
      process.env.STRIPES_PKG_MANAGER = 'yarn';
      const exec = stubExec(this.sandbox);

      return packageManager.install('/project').then(() => {
        expect(exec).to.have.been.calledWithMatch('yarn', { cwd: '/project' });
      });
    });

    it('installs with npm by default', function () {
      process.env.STRIPES_PKG_MANAGER = 'npm';
      const exec = stubExec(this.sandbox);

      return packageManager.install('/project').then(() => {
        expect(exec).to.have.been.calledWithMatch('npm install', { cwd: '/project' });
      });
    });

    it('logs stdout and stderr from the child process', function () {
      process.env.STRIPES_PKG_MANAGER = 'npm';
      stubExec(this.sandbox, { stdout: 'installing...', stderr: 'a warning' });

      return packageManager.install('/project').then(() => {
        expect(console.log).to.have.been.calledWithMatch('installing...');
        expect(console.error).to.have.been.calledWithMatch('a warning');
      });
    });

    it('rejects when the child process fails', function () {
      process.env.STRIPES_PKG_MANAGER = 'npm';
      const failure = new Error('command failed');
      stubExec(this.sandbox, { error: failure });

      return packageManager.install('/project').then(
        () => { throw new Error('expected install to reject'); },
        (err) => { expect(err).to.equal(failure); }
      );
    });
  });

  describe('add', function () {
    it('adds a dependency with pnpm, using the -D flag for dev dependencies', function () {
      process.env.STRIPES_PKG_MANAGER = 'pnpm';
      const exec = stubExec(this.sandbox);

      return packageManager.add('/project', ['lodash'], true).then(() => {
        expect(exec).to.have.been.calledWithMatch('pnpm add -D lodash', { cwd: '/project' });
      });
    });

    it('adds a dependency with yarn, using the --dev flag for dev dependencies', function () {
      process.env.STRIPES_PKG_MANAGER = 'yarn';
      const exec = stubExec(this.sandbox);

      return packageManager.add('/project', ['lodash'], true).then(() => {
        expect(exec).to.have.been.calledWithMatch('yarn add --dev lodash', { cwd: '/project' });
      });
    });

    it('adds a dependency with yarn, omitting the flag for non-dev dependencies', function () {
      process.env.STRIPES_PKG_MANAGER = 'yarn';
      const exec = stubExec(this.sandbox);

      return packageManager.add('/project', ['lodash'], false).then(() => {
        expect(exec).to.have.been.calledWithMatch('yarn add lodash', { cwd: '/project' });
      });
    });

    it('adds a dependency with npm, using --save-dev for dev dependencies', function () {
      process.env.STRIPES_PKG_MANAGER = 'npm';
      const exec = stubExec(this.sandbox);

      return packageManager.add('/project', ['lodash'], true).then(() => {
        expect(exec).to.have.been.calledWithMatch('npm install --save-dev lodash', { cwd: '/project' });
      });
    });

    it('adds a dependency with npm, using --save by default', function () {
      process.env.STRIPES_PKG_MANAGER = 'npm';
      const exec = stubExec(this.sandbox);

      return packageManager.add('/project', ['lodash'], false).then(() => {
        expect(exec).to.have.been.calledWithMatch('npm install --save lodash', { cwd: '/project' });
      });
    });

    it('flattens nested package name arrays', function () {
      process.env.STRIPES_PKG_MANAGER = 'npm';
      const exec = stubExec(this.sandbox);

      return packageManager.add('/project', [['lodash', 'chalk']], false).then(() => {
        expect(exec).to.have.been.calledWithMatch('npm install --save lodash chalk', { cwd: '/project' });
      });
    });
  });
});
