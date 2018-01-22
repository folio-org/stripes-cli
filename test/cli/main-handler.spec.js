const expect = require('chai').expect;
const context = require('../../lib/cli/context');
const mainHandlerModule = require('../../lib/cli/main-handler');

const stubs = {
  resolveIt: argv => Promise.resolve(argv),
  rejectIt: () => Promise.reject('uh-oh!'),
};

describe('The CLI main handler module', function () {
  beforeEach(function () {
    this.sut = mainHandlerModule;
  });

  describe('main handler', function () {
    beforeEach(function () {
      this.sandbox.spy(stubs, 'resolveIt');
      this.sandbox.stub(context, 'getContext').returns({});
    });

    it('accepts a next handler', function (done) {
      const handler = this.sut.mainHandler(stubs.resolveIt);

      handler('argv').then((result) => {
        expect(stubs.resolveIt).to.have.been.calledOnce;
        expect(result).to.equal('argv');
        done();
      });
    });

    it('passes argv to its handler', function (done) {
      const handler = this.sut.mainHandler(stubs.resolveIt);

      handler('argv').then(() => {
        const call = stubs.resolveIt.getCall(0);
        expect(call.args[0]).to.equal('argv');
        done();
      });
    });

    it('applies CLI context', function (done) {
      const handler = this.sut.mainHandler(stubs.resolveIt);

      handler({ workingDir: 'someDir' }).then(() => {
        expect(context.getContext).to.have.been.calledOnce;
        const call = context.getContext.getCall(0);
        expect(call.args[0]).to.equal('someDir');
        done();
      });
    });
  });
});
