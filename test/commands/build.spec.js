const expect = require('chai').expect;
const buildAppCommand = require('../../lib/commands/build');

const { ignoreCache } = require('../../lib/webpack-common');

const packageJsonStub = {};
const tenantConfig = {};

function StripesModuleParserStub(name) {
  this.packageJson = Object.assign({}, packageJsonStub, { name });
}

const stripesCoreStub = {
  api: {
    build: () => Promise.resolve({ hasErrors: () => {} }),
    StripesModuleParser: StripesModuleParserStub,
  }
};

const platformStub = {
  getWebpackOverrides: () => [],
  getStripesConfig: () => tenantConfig,
  getStripesCore: () => stripesCoreStub,
};

describe('The app create command', function () {
  beforeEach(function () {
    this.argv = {
      context: 'hello world',
      desc: 'my first app',
    };
    this.argv.context = {
      type: 'empty',
      cwd: '/path/to/working/directory',
      cliRoot: '/path/to/cliRoot',
      isEmpty: true,
    };

    this.sut = buildAppCommand;
    this.sandbox.spy(console, 'log');
    this.sandbox.spy(buildAppCommand, 'handler');
    this.sandbox.spy(stripesCoreStub.api, 'build');
  });

  it('calls "build app" handler with default output folder when --output flag is omitted.', function (done) {
    const expectedArgs = Object.assign({}, this.argv, { outputPath: './output', webpackOverrides: [] });
    this.sut.stripesOverrides(platformStub, stripesCoreStub);
    this.sut.handler(this.argv);

    expect(buildAppCommand.handler).to.have.been.calledOnce;
    expect(stripesCoreStub.api.build).to.have.been.calledWith(tenantConfig, expectedArgs);
    expect(console.log).to.have.been.calledWithMatch('Building...');
    done();
  });

  it('calls "build app" handler with specified output folder when --output flag is used.', function (done) {
    const expectedArgs = Object.assign({}, this.argv, { outputPath: './custom-path', output: './custom-path', webpackOverrides: [] });
    this.sut.stripesOverrides(platformStub, stripesCoreStub);
    this.sut.handler(Object.assign({}, this.argv, { output: './custom-path' }));

    expect(buildAppCommand.handler).to.have.been.calledOnce;
    expect(stripesCoreStub.api.build).to.have.been.calledWith(tenantConfig, expectedArgs);
    expect(console.log).to.have.been.calledWithMatch('Building...');
    done();
  });

  it('turns off webpack caching when --output flag is used.', function () {
    const expectedArgs = Object.assign({}, this.argv, { cache: false, outputPath: './output', webpackOverrides: [ignoreCache] });
    this.sut.stripesOverrides(platformStub, stripesCoreStub);
    this.sut.handler(Object.assign({}, this.argv, { cache: false }));

    expect(buildAppCommand.handler).to.have.been.calledOnce;
    expect(stripesCoreStub.api.build).to.have.been.calledWith(tenantConfig, expectedArgs);
  });
});
