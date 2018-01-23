const expect = require('chai').expect;
const inquirer = require('inquirer');
const questionModule = require('../../lib/cli/questions');

describe('The CLI questions module', function () {
  beforeEach(function () {
    this.sut = questionModule;
  });

  describe('yargsToInquirer function', function () {
    it('returns an inquirer questions array', function () {
      const yargsOptions = {
        tenant: {
          type: 'string',
          describe: 'Specify a tenant ID',
        },
      };
      const result = this.sut.yargsToInquirer(yargsOptions);
      expect(result).to.be.an('array');
      expect(result[0]).to.be.an('object').with.property('name');
      expect(result[0].name).to.equal('tenant');
    });

    it('maps yargs description to inquirer message', function () {
      const yargsOptions = {
        tenant: {
          type: 'string',
          describe: 'Specify a tenant ID',
        },
      };
      const result = this.sut.yargsToInquirer(yargsOptions);
      expect(result[0]).to.be.an('object').with.property('message');
      expect(result[0].message).to.equal(yargsOptions.tenant.describe);
    });

    it('converts a yargs type to inquirer type', function () {
      const yargsOptions = {
        tenant: {
          type: 'string',
          describe: 'Specify a tenant ID',
        },
        sourcemap: {
          type: 'boolean',
          describe: 'Include sourcemaps in build output',
        },
      };
      const result = this.sut.yargsToInquirer(yargsOptions);
      expect(result[0].type).to.equal('input');
      expect(result[1].type).to.equal('confirm');
    });

    it('applies inquirer-specific overrides', function () {
      const yargsOptions = {
        password: {
          type: 'string',
          describe: 'Okapi tenant password',
          inquirer: {
            type: 'password',
            mask: '*',
          },
        },
      };
      const result = this.sut.yargsToInquirer(yargsOptions);
      expect(result[0]).to.be.an('object').with.property('mask');
      expect(result[0].type).to.equal('password');
    });
  });

  describe('askIfUndefined function', function () {
    beforeEach(function () {
      this.argv = {
        username: 'user',
        interactive: true,
      };
      this.yargsOptions = {
        password: {
          describe: 'Okapi tenant password',
        },
      };
      this.sandbox.stub(inquirer, 'prompt').resolves({ password: 'password input' });
    });

    afterEach(function () {
      delete this.argv;
      delete this.yargsOptions;
      delete this.commandStub;
    });

    it('generates inquirer questions for missing yargs options', function (done) {
      this.sut.askIfUndefined(this.argv, this.yargsOptions)
        .then(() => {
          expect(inquirer.prompt).to.have.been.calledOnce;
          const inquirerCall = inquirer.prompt.getCall(0);
          expect(inquirerCall.args[0][0].name).to.equal('password');
          done();
        })
        .catch(err => console.log(err));
    });

    it('does not pass populated yargs options to inquirer', function (done) {
      this.argv.password = 'password1';
      this.yargsOptions.somethingElse = { describe: 'another option for testing' };

      this.sut.askIfUndefined(this.argv, this.yargsOptions)
        .then(() => {
          expect(inquirer.prompt).to.have.been.calledOnce;
          const inquirerCall = inquirer.prompt.getCall(0);
          expect(inquirerCall.args[0].length).to.equal(1);
          expect(inquirerCall.args[0][0].name).to.equal('somethingElse');
          done();
        });
    });

    it('does not invoke inquirer when all options are populated', function (done) {
      this.argv.password = 'password1';

      this.sut.askIfUndefined(this.argv, this.yargsOptions)
        .then(() => {
          expect(inquirer.prompt).not.to.have.been.called;
          done();
        });
    });

    it('merges answers with argv', function (done) {
      this.sut.askIfUndefined(this.argv, this.yargsOptions)
        .then((result) => {
          expect(result).to.be.an('object').with.property('username', 'user');
          expect(result).to.be.an('object').with.property('password', 'password input');
          done();
        });
    });
  });

  describe('prompt handler', function () {
    beforeEach(function () {
      this.argv = {
        username: 'user',
        interactive: true,
      };
      this.yargsOptions = {
        password: {
          describe: 'Okapi tenant password',
        },
      };
      this.commandStub = {
        handler: () => {},
      };

      this.sandbox.stub(inquirer, 'prompt').resolves({ password: 'password input' });
      this.sandbox.spy(this.commandStub, 'handler');
    });

    afterEach(function () {
      delete this.argv;
      delete this.yargsOptions;
      delete this.commandStub;
    });

    it('returns a function', function () {
      const result = this.sut.promptHandler({}, () => {});
      expect(result).is.a('function');
    });

    it('when invoked, calls the wrapped handler', function (done) {
      const wrappedHandler = this.sut.promptHandler(this.yargsOptions, this.commandStub.handler);
      wrappedHandler(this.argv).then(() => {
        expect(this.commandStub.handler).to.be.calledOnce;
        done();
      });
    });

    it('passes answers to the wrapped handler', function (done) {
      const wrappedHandler = this.sut.promptHandler(this.yargsOptions, this.commandStub.handler);
      wrappedHandler(this.argv).then(() => {
        const handlerCall = this.commandStub.handler.getCall(0);
        expect(handlerCall.args[0]).to.be.an('object').with.property('username', 'user');
        expect(handlerCall.args[0]).to.be.an('object').with.property('password', 'password input');
        done();
      });
    });
  });
});
