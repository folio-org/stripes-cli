const expect = require('chai').expect;
const NightmareService = require('../../lib/test/nightmare-service');

// Helper to validate order of the members in an array
// Chai supports ".ordered", but when combined with ".include", ordering begins at the start of the target
// This will check for consecutive order of members anywhere in the target array
function expectOrdered(target, members) {
  expect(target).to.include.members(members);
  for (let i = 1; i < members.length; i++) {
    const before = members[i - 1];
    const after = members[i];
    expect(target.indexOf(before)).to.equal(target.indexOf(after) - 1, `expected "${before}" to come before "${after}"`);
  }
}

const context = {
  cwd: './path/to/working/dir'
};

describe('The nightmare-service', function () {
  describe('prepareTestArgs method', function () {
    it('generates --workingDirectory', function () {
      this.sut = new NightmareService(context, {});
      expectOrdered(this.sut.testArgs, ['--workingDirectory', context.cwd]);
    });

    it('generates --url', function () {
      const options = { host: '127.0.0.1', port: '8080' };
      this.sut = new NightmareService(context, options);
      expectOrdered(this.sut.testArgs, ['--url', 'http://127.0.0.1:8080']);
    });

    it('defaults --url to localhost:3000', function () {
      const options = {};
      this.sut = new NightmareService(context, options);
      expectOrdered(this.sut.testArgs, ['--url', 'http://localhost:3000']);
    });

    it('generates --run for working directory', function () {
      const options = { run: 'new_user' };
      this.sut = new NightmareService(context, options);
      expectOrdered(this.sut.testArgs, ['--run', 'WD:new_user']);
    });

    it('defaults --run for working directory', function () {
      const options = {};
      this.sut = new NightmareService(context, options);
      expectOrdered(this.sut.testArgs, ['--run', 'WD']);
    });

    it('generates --show and --devTools', function () {
      const options = { show: true };
      this.sut = new NightmareService(context, options);
      expect(this.sut.testArgs).to.include.members(['--show', '--devTools']);
    });

    it('generates args for extra uiTest args', function () {
      const options = {
        uiTest: {
          username: 'admin',
          typeInterval: '100',
          show: true,
        }
      };
      this.sut = new NightmareService(context, options);
      expectOrdered(this.sut.testArgs, ['--username', 'admin']);
      expectOrdered(this.sut.testArgs, ['--typeInterval', '100']);
      expect(this.sut.testArgs).to.include.members(['--show']);
    });
  });

  describe('runNightmareTests method', function () {
    beforeEach(function () {
      const options = {};
      this.sut = new NightmareService(context, options);
      this.sandbox.stub(this.sut, 'runProcess').resolves();
    });

    it('calls runProcess with mocha', function () {
      this.sut.runNightmareTests();
      expect(this.sut.runProcess).to.be.calledOnce;
      expect(this.sut.runProcess).to.be.calledWithMatch('mocha');
    });

    it('passes test-module to mocha', function () {
      this.sut.runNightmareTests();
      const testArgs = this.sut.runProcess.args[0][1];
      expect(testArgs[0]).to.include('ui-testing/test-module.js');
    });

    it('passes test args to mocha', function () {
      this.sut.runNightmareTests();
      const testArgs = this.sut.runProcess.args[0][1];
      expectOrdered(testArgs, this.sut.testArgs);
    });
  });
});
