const expect = require('chai').expect;
const path = require('path');
const webpackCommon = require('../../lib/webpack-common');
const StripesPlatform = require('../../lib/platform/stripes-platform');

const stripesConfigStub = {
  okapi: {
    url: 'http://localhost:9130',
    tenant: 'diku',
  },
  config: {
    something: 'from test config file',
  },
  modules: {
    '@folio/trivial': {},
    '@folio/users': {},
  },
};

describe('The stripes-platform', function () {
  beforeEach(function () {
    this.sut = new StripesPlatform('', {});
    this.sut.config = {};
    this.sut.aliases = {};
  });

  describe('applyDefaultConfig method', function () {
    it('uses stripes config when provided', function () {
      this.sut.applyDefaultConfig(stripesConfigStub);
      expect(this.sut.config).to.have.keys('okapi', 'config', 'modules', 'branding');
      expect(this.sut.config).to.have.property('config').with.property('something', 'from test config file');
    });

    it('uses default config when no config is provided', function () {
      this.sut.applyDefaultConfig();
      expect(this.sut.config).to.have.keys('okapi', 'config', 'modules', 'branding');
    });
  });

  describe('applyVirtualAppPlatform method', function () {
    it('does nothing for not "app" context', function () {
      this.sut.isAppContext = false;
      this.sut.applyVirtualAppPlatform('my-app');
      expect(this.sut.config).to.deep.equal({});
      expect(this.sut.aliases).to.deep.equal({});
    });

    it('does nothing if missing module name', function () {
      this.sut.isAppContext = true;
      this.sut.applyVirtualAppPlatform();
      expect(this.sut.config).to.deep.equal({});
      expect(this.sut.aliases).to.deep.equal({});
    });

    it('adds app module to config', function () {
      this.sut.isAppContext = true;
      this.sut.applyVirtualAppPlatform('my-app');
      expect(this.sut.config).to.have.property('modules').with.property('my-app');
    });

    it('adds app module to an existing config', function () {
      this.sut.isAppContext = true;
      this.sut.config = {
        modules: {
          'not-my-app': { one: 'value' },
        },
      };
      this.sut.applyVirtualAppPlatform('my-app');
      expect(this.sut.config).to.have.property('modules').with.property('my-app');
    });

    it('does not override current app module\'s existing config', function () {
      this.sut.isAppContext = true;
      this.sut.config = {
        modules: {
          'my-app': { two: 'value' },
        },
      };
      this.sut.applyVirtualAppPlatform('my-app');
      expect(this.sut.config).to.have.property('modules').with.property('my-app').with.property('two');
    });

    it('does not override other app module configs', function () {
      this.sut.isAppContext = true;
      this.sut.config = {
        modules: {
          'not-my-app': { one: 'value' },
          'my-app': { two: 'value' },
        },
      };
      this.sut.applyVirtualAppPlatform('my-app');
      expect(this.sut.config).to.have.property('modules').with.property('not-my-app').with.property('one');
    });

    it('adds app alias', function () {
      this.sandbox.stub(path, 'resolve').returns('path/to/my-app');
      this.sut.isAppContext = true;
      this.sut.applyVirtualAppPlatform('my-app');
      expect(this.sut.aliases).to.have.property('my-app').with.match(/path\/to\/my-app/);
    });
  });

  describe('applyVirtualPlatform method', function () {
    it('loads validated aliases from service and calls applyAliasesToPlatform', function () {
      this.sandbox.stub(this.sut.aliasService, 'getValidatedAliases').returns('alias-mock');
      this.sandbox.stub(this.sut, 'applyAliasesToPlatform').returns({});
      this.sut.applyVirtualPlatform();
      expect(this.sut.aliasService.getValidatedAliases).to.have.been.calledOnce;
      expect(this.sut.applyAliasesToPlatform).to.have.been.calledWith('alias-mock');
    });
  });

  describe('applyAliasesToPlatform method', function () {
    beforeEach(function () {
      // applyAliasesToPlatform depends on initialization which we are sort of bypassing in above tests
      this.sut.applyDefaultConfig();
    });

    it('applies aliases to module config', function () {
      const validAliasMock = {
        '@folio/my-app': { path: '/path/to/ui-my-app', type: 'app', isValid: true },
      };
      this.sut.applyAliasesToPlatform(validAliasMock);
      expect(this.sut.config).to.have.property('modules').with.property('@folio/my-app');
    });

    it('does not apply aliases to module config when a config is provided', function () {
      this.sut.applyDefaultConfig(stripesConfigStub);
      const validAliasMock = {
        '@folio/my-app': { path: '/path/to/ui-my-app', type: 'app', isValid: true },
      };
      this.sut.applyAliasesToPlatform(validAliasMock);
      expect(this.sut.config).to.have.property('modules').but.not.property('@folio/my-app');
    });

    it('does not apply aliases of unspecified type to module config', function () {
      const validAliasMock = {
        '@folio/stripes-core': { path: '/path/to/stripes-core', isValid: true },
      };
      this.sut.applyAliasesToPlatform(validAliasMock);
      expect(this.sut.config).to.have.property('modules').but.not.property('@folio/stripes-core');
    });

    it('applies aliases to platform', function () {
      const validAliasMock = {
        '@folio/my-app': { path: '/path/to/ui-my-app', type: 'app', isValid: true },
      };
      this.sut.applyAliasesToPlatform(validAliasMock);
      expect(this.sut.aliases).to.have.property('@folio/my-app').with.match(/\/path\/to\/ui-my-app/);
    });
  });

  describe('applyCommandOptions method', function () {
    it('applies okapi, tenant, and hasAllPerms options', function () {
      const options = {
        okapi: 'http://localhost:8080',
        tenant: 'test-tenant',
        hasAllPerms: true,
      };
      this.sut.applyDefaultConfig();
      this.sut.applyCommandOptions(options);
      expect(this.sut.config).to.have.property('okapi').with.property('url', options.okapi);
      expect(this.sut.config).to.have.property('okapi').with.property('tenant', options.tenant);
      expect(this.sut.config).to.have.property('config').with.property('hasAllPerms', options.hasAllPerms);
    });
  });

  describe('getWebpackOverrides method', function () {
    beforeEach(function () {
      this.sandbox.spy(webpackCommon, 'cliAliases');
      this.sandbox.spy(webpackCommon, 'cliResolve');
    });

    it('adds cliResolve and cliAliases overrides', function () {
      const aliases = {
        '@folio/my-app': '/path/to/ui-my-app',
      };
      this.sut.aliases = aliases;
      const result = this.sut.getWebpackOverrides('mock context');
      expect(result).to.be.an('array').with.lengthOf(2);
      expect(webpackCommon.cliResolve).to.have.been.calledWith('mock context');
      expect(webpackCommon.cliAliases).to.have.been.calledWith(aliases);
    });
  });

  describe('Stripes platform context', function () {
    it('has "app" context if it is ui module', function () {
      this.sut = new StripesPlatform('', { isUiModule: true });

      expect(this.sut.isAppContext).to.be.true;
    });

    it('has not "app" context if it is not ui module', function () {
      this.sut = new StripesPlatform('', { isUiModule: false });

      expect(this.sut.isAppContext).to.be.false;
    });
  });
});
