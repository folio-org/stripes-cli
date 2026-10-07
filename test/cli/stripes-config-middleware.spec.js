const expect = require('chai').expect;
const path = require('path');
const stdin = require('../../lib/cli/stdin');
const { stripesConfigMiddleware } = require('../../lib/cli/stripes-config-middleware');
const StripesCliError = require('../../lib/cli/stripes-cli-error');
const stripesConfigTestFile = require('./stripes-test.config');

const stripesConfigStub = {
  okapi: {
    url: 'http://localhost:9130',
    tenant: 'diku',
  },
  config: {
    something: 'from test config',
  },
  modules: {
    '@folio/trivial': {},
    '@folio/users': {},
  },
};

const testConfigFile = path.resolve(__dirname, 'stripes-test.config.js');

describe('The stripes-config-middleware module', function () {
  describe('stripesConfigMiddleware', function () {
    beforeEach(function () {
      this.sut = stripesConfigMiddleware();
      this.sandbox.stub(stdin, 'getStdin').resolves(JSON.stringify(stripesConfigStub));
    });

    it('loads stripes config from file', function (done) {
      const argvIn = {
        configFile: testConfigFile
      };
      this.sut(argvIn).then((argv) => {
        expect(argv).to.be.an('object').with.property('stripesConfig');
        expect(argv.stripesConfig).to.deep.equal(stripesConfigTestFile);
        expect(stdin.getStdin).not.to.have.been.called;
        done();
      });
    });

    it('rejects when no file is found', function (done) {
      const argvIn = {
        configFile: path.resolve(__dirname, 'not-a-file.js'),
      };
      this.sut(argvIn)
        .catch((err) => {
          expect(err).to.be.an.instanceOf(StripesCliError);
          done();
        });
    });

    it('loads stripes config from stdin', function (done) {
      const argvIn = {};
      this.sut(argvIn).then((argv) => {
        expect(argv).to.be.an('object').with.property('stripesConfig');
        expect(argv.stripesConfig).to.deep.equal(stripesConfigStub);
        done();
      });
    });

    it('does not use stdin if fileOnly is true', function (done) {
      this.sut = stripesConfigMiddleware(true);
      const argvIn = {};
      this.sut(argvIn).then((argv) => {
        expect(argv).to.be.an('object').that.does.not.have.property('stripesConfig');
        done();
      });
    });

    it('assigns okapi from stripes config', function (done) {
      const argvIn = {};
      this.sut(argvIn).then((argv) => {
        expect(argv).to.be.an('object').with.property('okapi', 'http://localhost:9130');
        done();
      });
    });

    it('does not assign okapi when already set', function (done) {
      const argvIn = {
        okapi: 'my-okapi-url'
      };
      this.sut(argvIn).then((argv) => {
        expect(argv).to.be.an('object').with.property('okapi', 'my-okapi-url');
        done();
      });
    });

    it('assigns tenant from stripes config', function (done) {
      const argvIn = {};
      this.sut(argvIn).then((argv) => {
        expect(argv).to.be.an('object').with.property('tenant', 'diku');
        done();
      });
    });

    it('does not assign tenant when already set', function (done) {
      const argvIn = {
        tenant: 'my-tenant'
      };
      this.sut(argvIn).then((argv) => {
        expect(argv).to.be.an('object').with.property('tenant', 'my-tenant');
        done();
      });
    });
  });
});
