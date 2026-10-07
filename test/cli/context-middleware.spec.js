const expect = require('chai').expect;
const context = require('../../lib/cli/context');
const contextMiddleware = require('../../lib/cli/context-middleware');

const contextStub = {
  moduleName: 'myModule',
  isUiModule: true,
  cwd: 'someDir',
};

describe('The context-middleware module', function () {
  beforeEach(function () {
    this.sut = contextMiddleware;
    this.sandbox.stub(context, 'getContext').returns(contextStub);
    this.argvIn = {
      tenant: 'diku',
    };
  });

  describe('applyContext function', function () {
    it('applies CLI context to argv', function () {
      const argvOut = this.sut.applyContext(this.argvIn);
      expect(argvOut).to.be.an('object').with.property('context');
      expect(argvOut).to.deep.equal({
        tenant: 'diku',
        context: {
          moduleName: 'myModule',
          isUiModule: true,
          cwd: 'someDir'
        }
      });
    });

    it('passes working directory to getContext()', function () {
      this.argvIn.workingDir = './my/working/dir';
      this.sut.applyContext(this.argvIn);
      expect(context.getContext).to.have.been.calledOnce;
      const call = context.getContext.getCall(0);
      expect(call.args[0]).to.equal('./my/working/dir');
    });
  });

  describe('contextMiddleware function', function () {
    it('returns a function', function () {
      const result = this.sut.contextMiddleware();
      expect(result).is.a('function');
    });

    it('when invoked, returns promise with context applied to argv', function (done) {
      const middleware = this.sut.contextMiddleware();
      middleware(this.argvIn).then((argvOut) => {
        expect(argvOut).to.be.an('object').with.property('context');
        expect(argvOut).to.deep.equal({
          tenant: 'diku',
          context: {
            moduleName: 'myModule',
            isUiModule: true,
            cwd: 'someDir'
          }
        });
        done();
      });
    });
  });
});
